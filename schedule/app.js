// Service Worker 등록
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => {
      console.log('Service Worker 등록 완료');
    }).catch(err => {
      console.error('Service Worker 등록 실패:', err);
    });
  }
  
  // 알림 권한 요청
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        alert('알림 권한이 필요합니다!');
      }
    });
  }
  
  // DOM 요소 가져오기
  const form = document.getElementById('alarm-form');
  const alarmList = document.getElementById('alarm-list');
  
  // 알람 설정 이벤트 처리
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  
    const alarmTime = document.getElementById('alarm-time').value;
    if (!alarmTime) return;
  
    const alarmId = Date.now();
    const alarmData = { id: alarmId, time: alarmTime };
  
    // 알람 저장 및 표시
    saveAlarm(alarmData);
    displayAlarm(alarmData);
  
    // 시간 차이를 계산하여 알람 설정
    const timeDiff = calculateTimeDiff(alarmTime);
    if (timeDiff > 0) {
      console.log(`알람 설정 완료: ${alarmTime} (남은 시간: ${timeDiff}ms)`);
      setTimeout(() => triggerAlarm(alarmData), timeDiff);
    } else {
      alert('미래 시간을 설정해주세요!');
    }
  });
  
  // 로컬 스토리지에 알람 저장
  function saveAlarm(alarm) {
    const alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    alarms.push(alarm);
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }
  
  // 저장된 알람을 화면에 표시
  function displayAlarm(alarm) {
    const li = document.createElement('li');
    li.textContent = `알람: ${alarm.time}`;
    alarmList.appendChild(li);
  }
  
  // 알람 시간에 알림 표시
  function triggerAlarm(alarm) {
    console.log('알람 작동 중:', alarm.time);
    if (Notification.permission === 'granted') {
      new Notification('NewSchedule 알림', {
        body: `설정된 시간: ${alarm.time}`,
        icon: './icon.png'
      });
    } else {
      alert('알림 권한이 허용되지 않아 알람을 표시할 수 없습니다.');
    }
  }
  
  // 시간 차이를 밀리초 단위로 계산
  function calculateTimeDiff(alarmTime) {
    const now = new Date();
    const [hours, minutes] = alarmTime.split(':').map(Number);
    const alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    return alarmDate - now; // 밀리초 단위 시간 차이
  }
  
  // 페이지 로드 시 저장된 알람 표시
  window.addEventListener('load', () => {
    const alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    alarms.forEach(displayAlarm);
  });
  