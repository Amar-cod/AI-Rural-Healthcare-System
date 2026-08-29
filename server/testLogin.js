const testGetMe = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOTA5YWEzZDkxNzM2MGE2MjZmMzRiMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4ODAyNjE5MywiZXhwIjoxNzkwNjE4MTkzfQ.G45eaeT5x09TKdApQAzerFjINCvDstwMVus3lCgKP0Q'
      }
    });
    const data = await res.json();
    console.log('GetMe response:', res.status, data);
  } catch (err) {
    console.error('GetMe failed:', err);
  }
};

testGetMe();
