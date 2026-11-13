import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import supertest from "supertest";
import app from "../src/app";
import { createRateLimiter } from "../src/middleware/rateLimit";
import { getClientOrigin } from "../src/utils/config";
import { connectTestDb, disconnectTestDb } from "./helpers/testDb";

describe("Seguridad HTTP, CORS, healthcheck y rate limiting", () => {
  const allowedOrigin = getClientOrigin();

  before(async () => {
    await connectTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  describe("Cabeceras de seguridad (Helmet)", () => {
    it("incluye x-content-type-options: nosniff, protección de framing y oculta x-powered-by", async () => {
      const response = await supertest(app).get("/api/health");

      assert.equal(response.headers["x-content-type-options"], "nosniff");
      assert.ok(
        response.headers["x-frame-options"] ||
          response.headers["content-security-policy"],
        "La respuesta debe incluir x-frame-options o una cabecera equivalente de Helmet."
      );
      assert.equal(response.headers["x-powered-by"], undefined);
    });
  });

  describe("CORS", () => {
    it("permite el origen configurado, habilita credenciales y expone X-CSRF-Token", async () => {
      const response = await supertest(app)
        .get("/api/health")
        .set("Origin", allowedOrigin);

      assert.equal(
        response.headers["access-control-allow-origin"],
        allowedOrigin
      );
      assert.equal(response.headers["access-control-allow-credentials"], "true");

      const exposedHeaders = String(
        response.headers["access-control-expose-headers"] ?? ""
      )
        .split(",")
        .map((header) => header.trim().toLowerCase())
        .filter(Boolean);

      assert.ok(
        exposedHeaders.includes("x-csrf-token"),
        `Se esperaba X-CSRF-Token en access-control-expose-headers, se recibió: ${String(response.headers["access-control-expose-headers"])}`
      );
    });

    it("no devuelve access-control-allow-origin ante un origen no autorizado", async () => {
      const response = await supertest(app)
        .get("/api/health")
        .set("Origin", "https://sitio-no-autorizado.ejemplo");

      assert.equal(response.headers["access-control-allow-origin"], undefined);
    });

    it("responde al preflight OPTIONS /api/courses con credenciales habilitadas", async () => {
      const response = await supertest(app)
        .options("/api/courses")
        .set("Origin", allowedOrigin)
        .set("Access-Control-Request-Method", "POST");

      assert.ok(
        response.status === 204 || response.status === 200,
        `Se esperaba estado 204 o 200 en preflight, se recibió ${response.status}.`
      );
      assert.equal(response.headers["access-control-allow-credentials"], "true");
      assert.equal(
        response.headers["access-control-allow-origin"],
        allowedOrigin
      );
    });
  });

  describe("Healthcheck (GET /api/health)", () => {
    it("responde 200 con { status: 'ok', db: 'connected' } sin cookie ni CSRF cuando la BD está conectada", async () => {
      const response = await supertest(app).get("/api/health");

      assert.equal(response.status, 200);
      assert.deepEqual(response.body, {
        status: "ok",
        db: "connected",
      });
    });

    it("responde 503 con { status: 'error', db: 'disconnected' } cuando la BD está desconectada", async () => {
      try {
        await disconnectTestDb();

        const response = await supertest(app).get("/api/health");

        assert.equal(response.status, 503);
        assert.deepEqual(response.body, {
          status: "error",
          db: "disconnected",
        });
      } finally {
        await connectTestDb();
      }
    });
  });

  describe("Rate limiter (createRateLimiter)", () => {
    it("responde 429 con mensaje JSON y header ratelimit-limit al superar el límite con skipInTest: false", async () => {
      const rateLimitedApp = express();
      rateLimitedApp.get(
        "/prueba-limite",
        createRateLimiter({
          limit: 2,
          windowMs: 60_000,
          message: "Demasiados intentos.",
          skipInTest: false,
        }),
        (_request, response) => {
          response.status(200).json({ ok: true });
        }
      );

      const first = await supertest(rateLimitedApp).get("/prueba-limite");
      assert.equal(first.status, 200);

      const second = await supertest(rateLimitedApp).get("/prueba-limite");
      assert.equal(second.status, 200);

      const third = await supertest(rateLimitedApp).get("/prueba-limite");
      assert.equal(third.status, 429);
      assert.deepEqual(third.body, { error: "Demasiados intentos." });
      assert.equal(third.headers["ratelimit-limit"], "2");
    });

    it("permite superar el límite en NODE_ENV=test con la configuración por defecto (skipInTest: true)", async () => {
      const defaultApp = express();
      defaultApp.get(
        "/prueba-test-env",
        createRateLimiter({
          limit: 2,
          windowMs: 60_000,
          message: "Demasiados intentos.",
        }),
        (_request, response) => {
          response.status(200).json({ ok: true });
        }
      );

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await supertest(defaultApp).get("/prueba-test-env");
        assert.equal(response.status, 200);
      }
    });
  });
});
