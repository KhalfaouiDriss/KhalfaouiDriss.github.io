export const getAllData = async () => {
  try {
    const res = await fetch("norgrainse.kesug.com/GetAllData.php", {
      method: "GET",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


