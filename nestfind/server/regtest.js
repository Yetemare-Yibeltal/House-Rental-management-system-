const body = {
  firstName: "Test",
  lastName: "Landlord",
  email: "landlord3@test.com",
  password: "Test1234",
  confirmPassword: "Test1234",
  role: "landlord",
  phone: "0911234567",
};

fetch("http://localhost:5000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
  .then(async (r) => {
    console.log("STATUS:", r.status);
    console.log(await r.text());
  })
  .catch((e) => console.log("FETCH ERROR:", e.message));
