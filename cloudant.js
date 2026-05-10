const { CloudantV1 } = require('@ibm-cloud/cloudant');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');
const { v4: uuidv4 } = require('uuid');

let cloudantClient = null;
const usersDbName = process.env.CLOUDANT_DB_USERS || 'appid-users';
const bookingsDbName = process.env.CLOUDANT_DB_BOOKINGS || 'customer-bookings';

/**
 * Initialize Cloudant connection with API key authentication
 */
async function initCloudant() {
  try {
    const authenticator = new IamAuthenticator({
      apikey: process.env.CLOUDANT_API_KEY,
    });

    cloudantClient = new CloudantV1({
      authenticator: authenticator,
      serviceUrl: process.env.CLOUDANT_URL,
    });

    // Initialize databases
    await initializeDatabases();
    console.log('✓ Cloudant connected successfully');
    return cloudantClient;
  } catch (err) {
    console.error('Error initializing Cloudant:', err);
    throw err;
  }
}

/**
 * Create databases if they don't exist
 */
async function initializeDatabases() {
  const databases = [usersDbName, bookingsDbName];

  for (const dbName of databases) {
    try {
      await cloudantClient.putDatabase({ db: dbName });
      console.log(`✓ Database '${dbName}' created`);
    } catch (err) {
      if (err.status === 412) {
        console.log(`✓ Database '${dbName}' already exists`);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Save or update user data after AppID login
 */
async function saveUser(userData) {
  try {
    const userId = userData.sub || userData.id;
    
    const userDoc = {
      _id: userId,
      type: 'user',
      email: userData.email,
      name: userData.name,
      givenName: userData.given_name,
      familyName: userData.family_name,
      picture: userData.picture,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Check if user exists
    try {
      const response = await cloudantClient.getDocument({ db: usersDbName, docId: userId });
      const existing = response.result;
      userDoc._rev = existing._rev;
      userDoc.createdAt = existing.createdAt;
    } catch (err) {
      // User doesn't exist, create new
      if (err.status !== 404) throw err;
    }

    const result = await cloudantClient.putDocument({ db: usersDbName, docId: userId, document: userDoc });
    console.log(`✓ User ${userId} saved/updated in Cloudant`);
    return result.result;
  } catch (err) {
    console.error('Error saving user:', err);
    throw err;
  }
}

/**
 * Get user data
 */
async function getUser(userId) {
  try {
    const response = await cloudantClient.getDocument({ db: usersDbName, docId: userId });
    return response.result;
  } catch (err) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Create a booking
 */
async function createBooking(booking) {
  try {
    const bookingId = uuidv4();
    
    const bookingDoc = {
      _id: bookingId,
      type: 'booking',
      userId: booking.userId,
      customerName: booking.customerName,
      email: booking.email,
      phone: booking.phone,
      serviceType: booking.serviceType,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      duration: booking.duration,
      notes: booking.notes || '',
      status: 'pending', // pending, confirmed, completed, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await cloudantClient.putDocument({ db: bookingsDbName, docId: bookingId, document: bookingDoc });
    console.log(`✓ Booking ${bookingId} created`);
    return { id: bookingId, ...bookingDoc, _rev: result.result.rev };
  } catch (err) {
    console.error('Error creating booking:', err);
    throw err;
  }
}

/**
 * Get booking by ID
 */
async function getBooking(bookingId) {
  try {
    const response = await cloudantClient.getDocument({ db: bookingsDbName, docId: bookingId });
    return response.result;
  } catch (err) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Get all bookings for a user
 */
async function getUserBookings(userId) {
  try {
    const response = await cloudantClient.postFind({
      db: bookingsDbName,
      selector: { userId: userId, type: 'booking' },
    });
    return response.result.docs;
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    throw err;
  }
}

/**
 * Get all bookings (admin view)
 */
async function getAllBookings(limit = 100, skip = 0) {
  try {
    const response = await cloudantClient.postFind({
      db: bookingsDbName,
      selector: { type: 'booking' },
      limit: limit,
      skip: skip,
    });
    return response.result.docs;
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    throw err;
  }
}

/**
 * Update booking
 */
async function updateBooking(bookingId, updates) {
  try {
    const response = await cloudantClient.getDocument({ db: bookingsDbName, docId: bookingId });
    const booking = response.result;
    
    const updatedDoc = {
      ...booking,
      ...updates,
      _id: booking._id,
      _rev: booking._rev,
      updatedAt: new Date().toISOString(),
    };

    const result = await cloudantClient.putDocument({ db: bookingsDbName, docId: bookingId, document: updatedDoc });
    console.log(`✓ Booking ${bookingId} updated`);
    return { ...updatedDoc, _rev: result.result.rev };
  } catch (err) {
    console.error('Error updating booking:', err);
    throw err;
  }
}

/**
 * Delete booking
 */
async function deleteBooking(bookingId) {
  try {
    const response = await cloudantClient.getDocument({ db: bookingsDbName, docId: bookingId });
    const booking = response.result;
    await cloudantClient.deleteDocument({ db: bookingsDbName, docId: bookingId, rev: booking._rev });
    console.log(`✓ Booking ${bookingId} deleted`);
    return true;
  } catch (err) {
    console.error('Error deleting booking:', err);
    throw err;
  }
}

/**
 * Get bookings by status
 */
async function getBookingsByStatus(status) {
  try {
    const response = await cloudantClient.postFind({
      db: bookingsDbName,
      selector: { type: 'booking', status: status },
    });
    return response.result.docs;
  } catch (err) {
    console.error('Error fetching bookings by status:', err);
    throw err;
  }
}

module.exports = {
  initCloudant,
  saveUser,
  getUser,
  createBooking,
  getBooking,
  getUserBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getBookingsByStatus,
};
