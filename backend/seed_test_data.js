const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const Internship = require('./models/Internship');
const Application = require('./models/Application');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user if doesn't exist
    let admin = await User.findOne({ email: 'admin@university.edu' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@university.edu',
        password: 'admin123',
        role: 'system_admin',
        isActive: true,
        approvalStatus: 'approved'
      });
      console.log('✅ Created admin user');
    }

    // Create test student
    let student = await User.findOne({ email: 'student@university.edu' });
    if (!student) {
      student = await User.create({
        name: 'John Doe',
        email: 'student@university.edu',
        password: 'student123',
        role: 'student',
        isActive: true,
        approvalStatus: 'approved'
      });
      console.log('✅ Created test student');
    }

    // Create student profile
    let profile = await StudentProfile.findOne({ userId: student._id });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: student._id,
        name: student.name,
        cgpa: 3.8,
        department: 'Computer Science',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        verifiedSkills: [],
        bio: 'Test student profile'
      });
      console.log('✅ Created student profile');
    }

    // Create test internship
    let internship = await Internship.findOne({ title: 'Frontend Developer Internship' });
    if (!internship) {
      internship = await Internship.create({
        title: 'Frontend Developer Internship',
        description: 'Build amazing UIs',
        companyId: admin._id,
        minCGPA: 3.0,
        requiredSkills: [
          { skill: 'JavaScript' },
          { skill: 'React' },
          { skill: 'CSS' }
        ],
        duration: 12,
        location: 'Remote',
        status: 'active'
      });
      console.log('✅ Created test internship');
    }

    // Create application
    let app = await Application.findOne({ 
      studentId: student._id, 
      internshipId: internship._id 
    });
    if (!app) {
      app = await Application.create({
        studentId: student._id,
        internshipId: internship._id,
        status: 'Pending',
        appliedAt: new Date()
      });
      console.log('✅ Created test application');
    }

    // Create another student for variety
    let student2 = await User.findOne({ email: 'jane@university.edu' });
    if (!student2) {
      student2 = await User.create({
        name: 'Jane Smith',
        email: 'jane@university.edu',
        password: 'student123',
        role: 'student',
        isActive: true,
        approvalStatus: 'approved'
      });
      console.log('✅ Created second test student');

      const profile2 = await StudentProfile.create({
        userId: student2._id,
        name: student2.name,
        cgpa: 3.6,
        department: 'Information Technology',
        skills: ['Python', 'Django', 'SQL', 'JavaScript'],
        verifiedSkills: [],
        bio: 'Second test student'
      });
      console.log('✅ Created second student profile');

      const app2 = await Application.create({
        studentId: student2._id,
        internshipId: internship._id,
        status: 'Pending',
        appliedAt: new Date()
      });
      console.log('✅ Created second test application');
    }

    console.log('\n✅ Seed data created successfully!');
    console.log('You can now login as: admin@university.edu / admin123');
    console.log('And you should see students in the skill verification dropdown');

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
    process.exit(1);
  }
}

seedData();
