import User from '../../models/UserModel.js';
import '../setup.js';

describe('User Model Tests', () => {
  it('should create a user successfully', async () => {
    const userData = {
      auth0Id: 'test-123',
      profile: {
        displayName: 'Test User',
        isPublic: true,
      },
      artistsSeenLive: [],
    };

    const user = await User.create(userData);

    expect(user.auth0Id).toBe('test-123');
    expect(user.profile.displayName).toBe('Test User');
    expect(user.profile.isPublic).toBe(true);
  });

  it('should require auth0Id', async () => {
    const userData = {
      profile: {
        displayName: 'Test User',
      },
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should add artist to artistsSeenLive', async () => {
    const user = await User.create({
      auth0Id: 'test-456',
      artistsSeenLive: [],
    });

    user.artistsSeenLive.push({
      artistId: 'artist-1',
      artistName: 'Test Artist',
      concerts: ['concert-1'],
    });

    await user.save();

    const updatedUser = await User.findOne({ auth0Id: 'test-456' });
    expect(updatedUser.artistsSeenLive).toHaveLength(1);
    expect(updatedUser.artistsSeenLive[0].artistId).toBe('artist-1');
  });
});
