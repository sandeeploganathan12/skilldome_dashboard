async function test() {
  const res = await fetch('http://localhost:5000/api/students');
  const data = await res.json();
  console.log('Total students:', data.students ? data.students.length : 0);
  if (data.students) {
    data.students.slice(0, 5).forEach(s => console.log(s.studentId, s.name, s.email));
  }
}
test();
