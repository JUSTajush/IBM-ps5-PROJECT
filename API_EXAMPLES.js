// API Usage Examples - IBM Cloudant Booking System
// Use these examples to integrate bookings into your frontend

// ============================================
// 1. BOOKING CREATION EXAMPLE
// ============================================

async function createNewBooking() {
  const booking = {
    customerName: "John Doe",
    email: "john@example.com",
    phone: "+1-555-123-4567",
    serviceType: "Consultation",
    bookingDate: "2024-05-20",
    bookingTime: "14:00",
    duration: "60",
    notes: "Please call 10 minutes before appointment"
  };

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(booking)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newBooking = await response.json();
    console.log('Booking created:', newBooking);
    console.log('Booking ID:', newBooking._id);
    return newBooking;
  } catch (error) {
    console.error('Error creating booking:', error);
  }
}

// ============================================
// 2. GET ALL USER BOOKINGS
// ============================================

async function getAllUserBookings() {
  try {
    const response = await fetch('/api/bookings');

    if (response.status === 401) {
      console.log('User not authenticated');
      window.location.href = '/auth/login';
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bookings = await response.json();
    console.log('User bookings:', bookings);
    
    // Display bookings
    displayBookingsTable(bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
  }
}

// ============================================
// 3. GET SPECIFIC BOOKING BY ID
// ============================================

async function getBookingDetails(bookingId) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const booking = await response.json();
    console.log('Booking details:', booking);
    return booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
  }
}

// ============================================
// 4. UPDATE BOOKING STATUS
// ============================================

async function confirmBooking(bookingId) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'confirmed'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedBooking = await response.json();
    console.log('Booking confirmed:', updatedBooking);
    return updatedBooking;
  } catch (error) {
    console.error('Error confirming booking:', error);
  }
}

async function completeBooking(bookingId) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedBooking = await response.json();
    console.log('Booking completed:', updatedBooking);
    return updatedBooking;
  } catch (error) {
    console.error('Error completing booking:', error);
  }
}

// ============================================
// 5. UPDATE BOOKING DETAILS
// ============================================

async function updateBookingDetails(bookingId, updates) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerName: updates.customerName || undefined,
        bookingDate: updates.bookingDate || undefined,
        bookingTime: updates.bookingTime || undefined,
        notes: updates.notes || undefined,
        // ... other fields you want to update
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedBooking = await response.json();
    console.log('Booking updated:', updatedBooking);
    return updatedBooking;
  } catch (error) {
    console.error('Error updating booking:', error);
  }
}

// ============================================
// 6. DELETE/CANCEL BOOKING
// ============================================

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return false;
  }

  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Booking cancelled:', result);
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
}

// ============================================
// 7. GET BOOKINGS BY STATUS
// ============================================

async function getPendingBookings() {
  try {
    const response = await fetch('/api/bookings/status/pending');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bookings = await response.json();
    console.log('Pending bookings:', bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
  }
}

async function getConfirmedBookings() {
  try {
    const response = await fetch('/api/bookings/status/confirmed');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bookings = await response.json();
    console.log('Confirmed bookings:', bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching confirmed bookings:', error);
  }
}

// ============================================
// 8. GET ALL BOOKINGS (ADMIN VIEW)
// ============================================

async function getAllBookings(limit = 50, skip = 0) {
  try {
    const response = await fetch(
      `/api/bookings/all?limit=${limit}&skip=${skip}`
    );

    if (response.status === 401) {
      console.log('Authentication required');
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bookings = await response.json();
    console.log(`Bookings (${limit} per page, skip ${skip}):`, bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching all bookings:', error);
  }
}

// ============================================
// 9. DISPLAY BOOKINGS IN A TABLE
// ============================================

function displayBookingsTable(bookings) {
  if (!bookings || bookings.length === 0) {
    console.log('No bookings to display');
    return;
  }

  console.table(bookings.map(b => ({
    ID: b._id.substring(0, 8) + '...',
    Customer: b.customerName,
    Service: b.serviceType,
    Date: b.bookingDate,
    Time: b.bookingTime,
    Status: b.status,
    Phone: b.phone
  })));
}

// ============================================
// 10. FORM VALIDATION EXAMPLE
// ============================================

function validateBookingForm(booking) {
  const errors = [];

  if (!booking.customerName || booking.customerName.trim() === '') {
    errors.push('Customer name is required');
  }

  if (!booking.email || !isValidEmail(booking.email)) {
    errors.push('Valid email is required');
  }

  if (!booking.phone || booking.phone.trim() === '') {
    errors.push('Phone number is required');
  }

  if (!booking.serviceType || booking.serviceType === '') {
    errors.push('Service type is required');
  }

  if (!booking.bookingDate || !isValidDate(booking.bookingDate)) {
    errors.push('Valid booking date is required');
  }

  if (!booking.bookingTime || !isValidTime(booking.bookingTime)) {
    errors.push('Valid booking time is required');
  }

  if (!booking.duration || parseInt(booking.duration) < 15) {
    errors.push('Duration must be at least 15 minutes');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(date) {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
}

function isValidTime(time) {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

// ============================================
// 11. ERROR HANDLING HELPER
// ============================================

async function handleApiError(response) {
  if (!response.ok) {
    let errorMessage = `HTTP Error: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Could not parse error response
    }

    throw new Error(errorMessage);
  }

  return response;
}

// ============================================
// 12. COMPLETE WORKFLOW EXAMPLE
// ============================================

async function completeBookingWorkflow() {
  try {
    // Step 1: Create a booking
    console.log('Step 1: Creating booking...');
    const newBooking = await createNewBooking();

    // Step 2: Get all user bookings
    console.log('Step 2: Fetching all bookings...');
    const allBookings = await getAllUserBookings();

    // Step 3: Get booking details
    console.log('Step 3: Getting booking details...');
    const bookingDetails = await getBookingDetails(newBooking._id);

    // Step 4: Confirm the booking
    console.log('Step 4: Confirming booking...');
    const confirmedBooking = await confirmBooking(newBooking._id);

    // Step 5: Update booking notes
    console.log('Step 5: Updating booking notes...');
    await updateBookingDetails(newBooking._id, {
      notes: 'Updated notes from workflow'
    });

    // Step 6: Get pending bookings
    console.log('Step 6: Getting pending bookings...');
    const pendingBookings = await getPendingBookings();

    console.log('✓ Complete workflow finished successfully!');
  } catch (error) {
    console.error('Workflow error:', error);
  }
}

// ============================================
// 13. BOOKING STATUS MANAGEMENT
// ============================================

const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

async function changeBookingStatus(bookingId, newStatus) {
  if (!Object.values(BOOKING_STATUSES).includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.status}`);
    }

    const updatedBooking = await response.json();
    console.log(`Booking status changed to: ${newStatus}`);
    return updatedBooking;
  } catch (error) {
    console.error('Error changing booking status:', error);
  }
}

// ============================================
// 14. EXPORT FUNCTIONS FOR USE IN OTHER FILES
// ============================================

// If using in a module, export these:
// export {
//   createNewBooking,
//   getAllUserBookings,
//   getBookingDetails,
//   confirmBooking,
//   completeBooking,
//   updateBookingDetails,
//   cancelBooking,
//   getPendingBookings,
//   getConfirmedBookings,
//   getAllBookings,
//   validateBookingForm,
//   changeBookingStatus
// };

// ============================================
// USAGE IN HTML
// ============================================

/*

<!-- Add a button to create booking -->
<button onclick="createNewBooking()">Create Booking</button>

<!-- Add a button to refresh bookings -->
<button onclick="getAllUserBookings()">Refresh Bookings</button>

<!-- Add form with validation -->
<form onsubmit="submitBookingForm(event)">
  <input type="text" id="customerName" placeholder="Name" required>
  <input type="email" id="email" placeholder="Email" required>
  <input type="tel" id="phone" placeholder="Phone" required>
  <select id="serviceType" required>
    <option value="Consultation">Consultation</option>
    <option value="Meeting">Meeting</option>
    <option value="Support">Support</option>
  </select>
  <input type="date" id="bookingDate" required>
  <input type="time" id="bookingTime" required>
  <input type="number" id="duration" min="15" step="15" value="60" required>
  <textarea id="notes" placeholder="Notes (optional)"></textarea>
  <button type="submit">Book Now</button>
</form>

<script>
function submitBookingForm(event) {
  event.preventDefault();
  
  const booking = {
    customerName: document.getElementById('customerName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    serviceType: document.getElementById('serviceType').value,
    bookingDate: document.getElementById('bookingDate').value,
    bookingTime: document.getElementById('bookingTime').value,
    duration: document.getElementById('duration').value,
    notes: document.getElementById('notes').value
  };
  
  const validation = validateBookingForm(booking);
  
  if (!validation.valid) {
    alert('Validation errors:\\n' + validation.errors.join('\\n'));
    return;
  }
  
  createNewBooking();
}
</script>

*/
