let currentPage = 1;
let selectedflag = false
let inputflag = false
let data_gradelevel = ""
let data_language = ""
let data_country = ""

function showPage(direction) {
  if (currentPage == 1) {
    if (selectedflag == false) {
      alert("Please select a grade level")
      return
    }
  }
  const totalPages = 2;
  if (direction === 'next' && currentPage < totalPages) {
    currentPage++;
  } else if (direction === 'previous' && currentPage > 1) {
    currentPage--;
  }
  document.querySelector('.page.active').classList.remove('active');
  document.getElementById('page' + currentPage).classList.add('active');
  document.getElementById('next-btn').style.display = currentPage === totalPages ? 'none' : 'block';
  document.getElementById('previous-btn').style.display = currentPage > 1 ? 'block' : 'none';
  document.querySelector('.complete-button').style.display = currentPage === totalPages ? 'block' : 'none';

  // 更新进度条
  updateProgressBar(currentPage, totalPages);
}

function updateProgressBar(currentPage, totalPages) {
  const progress = document.getElementById('progress');
  const percentage = (currentPage / totalPages) * 100;
  progress.style.width = `${percentage}%`;
}

function selectGrade(button) {
  // 清除所有按钮的选中样式
  document.querySelectorAll('.grade-button').forEach(btn => btn.classList.remove('selected'));
  // 设置选中按钮的样式
  button.classList.add('selected');
  // 输出按钮的文字内容到控制台
  //console.log(button.innerText);
  data_gradelevel = button.innerText
  selectedflag = true
}

function skip() {
  let data = JSON.stringify({
    "user_name": localStorage.getItem('username'),
    "language": null,
    "country": null,
    "grade_level": null
  })
  submit(data)


}
function submitForm() {
  let language = document.getElementById('language').value.trim();
  let country = document.getElementById('country').value.trim();
  if (language && country) {
    data_language = document.getElementById('language').value;
    data_country = document.getElementById('country').value;
    //提交表单
    let data = JSON.stringify({
      "user_name": localStorage.getItem('username'),
      "language": data_language,
      "country": data_country,
      "grade_level": data_gradelevel
    })
    alert(data)
    submit(data)

    //清空内容

  } else {
    alert('Please fill in all fields');
  }
}

// 初始化按钮状态和进度条
document.getElementById('next-btn').style.display = 'block';
document.getElementById('previous-btn').style.display = 'none';
document.querySelector('.complete-button').style.display = 'none';
updateProgressBar(currentPage, 2);


function submit(data1) {
  let token = localStorage.getItem('token');
  console.log(JSON.parse(token).message);
  axios({
    url: 'http://localhost:8080/EntryTestSubmit',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'token': JSON.parse(token).message
    },
    data: data1
  }).then(function (response) {
    console.log(response);
    if (response.data.code == 200) {
      console.log(response.data.message);
      window.location.href = 'index.html';
    } else {
      alert(response.data.message);
    }
  })
}
