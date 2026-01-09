/**
 * Formats a date value for HTML date input (type="date")
 * HTML date inputs require YYYY-MM-DD format
 * 
 * @param {string|Date|null|undefined} dateValue - Date value from database or form
 * @returns {string} - Formatted date in YYYY-MM-DD format or empty string
 */
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  
  try {
    // If it's already in YYYY-MM-DD format, return as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Parse the date
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error, dateValue);
    return "";
  }
};

