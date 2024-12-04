// Get User age For Calculate Prediction
const getUserAge = (birthdate) => {
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const convertToISOString = (date) => {
  const [day, month, year] = date.split("/");
  const dateObject = new Date(year, month - 1, day);
  return dateObject.toISOString().slice(0, 10);
};

module.exports = { getUserAge, convertToISOString };
