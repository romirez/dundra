import request from 'supertest';
import app from '../app';

describe('Express App', () => {
  test('should respond to health check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Dundra API is running!',
      timestamp: expect.any(String),
      environment: 'test',
    });
  });

  test('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route not found',
    });
  });

  test('should have proper CORS headers', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});
