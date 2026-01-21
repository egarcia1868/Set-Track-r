import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set required environment variables for auth middleware
process.env.AUTH0_AUDIENCE = 'test-audience';
process.env.AUTH0_DOMAIN = 'test.auth0.com';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
