const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Report = require('../models/Report');
const QueueEntry = require('../models/QueueEntry');

async function seedData() {
  try {
    // Determine MONGO_URI
    const uri = process.env.MONGO_URI && process.env.MONGO_URI !== 'your_mongodb_atlas_connection_string' 
      ? process.env.MONGO_URI 
      : 'mongodb://127.0.0.1:27017/rhcs';
      
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    console.log('Clearing old collections...');
    await User.deleteMany({ role: { $ne: 'admin' } }); // Keep the admin!
    await Consultation.deleteMany({});
    await Prescription.deleteMany({});
    await Report.deleteMany({});
    await QueueEntry.deleteMany({});
    console.log('Collections cleared.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create Doctors
    console.log('Creating Doctors...');
    const doctorsData = [
      {
        name: 'Dr. Sarah Smith',
        email: 'sarah@rhcs.com',
        passwordHash,
        role: 'doctor',
        phone: '9876543210',
        specialization: 'General Physician',
        qualifications: 'MBBS, MD',
        licenseNumber: 'MED-12345',
        verificationStatus: 'approved'
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit@rhcs.com',
        passwordHash,
        role: 'doctor',
        phone: '9876543211',
        specialization: 'Cardiologist',
        qualifications: 'MBBS, MD, DM Cardiology',
        licenseNumber: 'MED-54321',
        verificationStatus: 'approved'
      },
      {
        name: 'Dr. Emily Chen',
        email: 'emily@rhcs.com',
        passwordHash,
        role: 'doctor',
        phone: '9876543212',
        specialization: 'Pediatrician',
        qualifications: 'MBBS, MD Pediatrics',
        licenseNumber: 'MED-98765',
        verificationStatus: 'approved'
      }
    ];
    const createdDoctors = await User.insertMany(doctorsData);
    
    // Create Patients
    console.log('Creating Patients...');
    const patientsData = [
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        passwordHash,
        role: 'patient',
        phone: '5551234567'
      },
      {
        name: 'Priya Singh',
        email: 'priya@example.com',
        passwordHash,
        role: 'patient',
        phone: '5559876543'
      }
    ];
    const createdPatients = await User.insertMany(patientsData);

    // Create Past Consultations, Prescriptions and Reports
    console.log('Creating Past History...');
    
    // Consultation 1
    const consultation1 = await Consultation.create({
      patientId: createdPatients[0]._id,
      doctorId: createdDoctors[0]._id,
      aiSessionId: null, // No AI session for mock past data
      finalPriority: 'routine',
      notes: 'Patient came in with mild fever and body ache. Prescribed paracetamol and rest.',
      status: 'completed'
    });

    const prescription1 = await Prescription.create({
      consultationId: consultation1._id,
      patientId: createdPatients[0]._id,
      doctorId: createdDoctors[0]._id,
      medicines: [
        { name: 'Paracetamol', dosage: '500mg', instructions: 'Twice a day after meals' },
        { name: 'Vitamin C', dosage: '500mg', instructions: 'Once a day' }
      ]
    });

    await Report.create({
      patientId: createdPatients[0]._id,
      doctorId: createdDoctors[0]._id,
      consultationId: consultation1._id,
      title: `Consultation Report - ${new Date().toLocaleDateString()}`,
      content: 'Mild viral infection. Prescribed symptomatic treatment.',
      fileUrl: null // Could map to a mock PDF, but null works for empty state testing
    });

    // Consultation 2
    const consultation2 = await Consultation.create({
      patientId: createdPatients[1]._id,
      doctorId: createdDoctors[1]._id,
      aiSessionId: null,
      finalPriority: 'high',
      notes: 'Patient complained of chest pain. BP was slightly elevated. Recommended ECG.',
      status: 'completed'
    });

    await Prescription.create({
      consultationId: consultation2._id,
      patientId: createdPatients[1]._id,
      doctorId: createdDoctors[1]._id,
      medicines: [
        { name: 'Aspirin', dosage: '75mg', instructions: 'Once a day' }
      ]
    });
    
    console.log('Demo Data Seeded Successfully!');
    console.log('---');
    console.log('Login credentials for testing:');
    console.log('All non-admin passwords are: password123');
    console.log('Patients:', patientsData.map(p => p.email).join(', '));
    console.log('Doctors:', doctorsData.map(d => d.email).join(', '));
    console.log('---');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

seedData();
