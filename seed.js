const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    // await User.deleteMany({});
    // await Club.deleteMany({});

    // Create admin user
    const adminUser = await User.findOne({ email: 'admin@clubsphere.com' });
    if (!adminUser) {
      await User.create({
        name: 'Admin User',
        email: 'admin@clubsphere.com',
        photoURL: 'https://via.placeholder.com/150',
        role: 'admin',
        firebaseUID: 'admin-firebase-uid' // You'll need to replace this with actual Firebase UID
      });
      console.log('Admin user created');
    }

    // Create sample club manager
    const managerUser = await User.findOne({ email: 'manager@clubsphere.com' });
    if (!managerUser) {
      await User.create({
        name: 'Club Manager',
        email: 'manager@clubsphere.com',
        photoURL: 'https://via.placeholder.com/150',
        role: 'clubManager',
        firebaseUID: 'manager-firebase-uid' // You'll need to replace this with actual Firebase UID
      });
      console.log('Manager user created');
    }

    // Create sample member
    const memberUser = await User.findOne({ email: 'member@clubsphere.com' });
    if (!memberUser) {
      await User.create({
        name: 'Member User',
        email: 'member@clubsphere.com',
        photoURL: 'https://via.placeholder.com/150',
        role: 'member',
        firebaseUID: 'member-firebase-uid' // You'll need to replace this with actual Firebase UID
      });
      console.log('Member user created');
    }

    // Create sample clubs
    const sampleClubs = [
      {
        clubName: 'Photography Enthusiasts',
        description: 'A community for photography lovers to share techniques, organize photo walks, and improve their skills together.',
        category: 'Photography',
        location: 'New York, NY',
        bannerImage: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=400&fit=crop',
        membershipFee: 15,
        status: 'approved',
        managerEmail: 'manager@clubsphere.com',
        memberCount: 25
      },
      {
        clubName: 'Tech Innovators',
        description: 'Join fellow tech enthusiasts to discuss latest trends, share projects, and network with like-minded individuals.',
        category: 'Tech',
        location: 'San Francisco, CA',
        bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
        membershipFee: 0,
        status: 'approved',
        managerEmail: 'manager@clubsphere.com',
        memberCount: 42
      },
      {
        clubName: 'Hiking Adventures',
        description: 'Explore beautiful trails and mountains with our hiking community. All skill levels welcome!',
        category: 'Sports',
        location: 'Denver, CO',
        bannerImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop',
        membershipFee: 10,
        status: 'approved',
        managerEmail: 'manager@clubsphere.com',
        memberCount: 18
      },
      {
        clubName: 'Book Lovers Society',
        description: 'Monthly book discussions, author meetups, and literary events for passionate readers.',
        category: 'Books',
        location: 'Boston, MA',
        bannerImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
        membershipFee: 5,
        status: 'pending',
        managerEmail: 'manager@clubsphere.com',
        memberCount: 0
      }
    ];

    for (const clubData of sampleClubs) {
      const existingClub = await Club.findOne({ clubName: clubData.clubName });
      if (!existingClub) {
        await Club.create(clubData);
        console.log(`Created club: ${clubData.clubName}`);
      }
    }

    console.log('Seed data created successfully!');
    console.log('\nDefault users created:');
    console.log('Admin: admin@clubsphere.com (role: admin)');
    console.log('Manager: manager@clubsphere.com (role: clubManager)');
    console.log('Member: member@clubsphere.com (role: member)');
    console.log('\nNote: You need to create these users in Firebase Authentication and update the firebaseUID in the database.');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();