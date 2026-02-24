let chatRooms = [];
let currentRoom = null;
let selectedSpeaker = null;
let commandHistory = [];
let currentUser = null;
let peer = null;
let my_peer = null;
let typingTimer;                // 타이핑 중단 감지용 타이머
let isTyping = false;           // 현재 '입력 중' 상태인지 기록
const doneTypingInterval = 3000; // 3초 동안 입력 없으면 '숨김' 처리

let uuid = Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);

const chatList = document.getElementById('chatList');
const chatRoom = document.getElementById('chatRoom');
const emptyState = document.getElementById('emptyState');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const roomTitle = document.getElementById('roomTitle');
const roomStatus = document.getElementById('roomStatus');
const backBtn = document.getElementById('backBtn');
const searchInput = document.getElementById('searchInput');
const chatSidebar = document.querySelector('.chat-sidebar');

const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomModal = document.getElementById('createRoomModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const roomTitleInput = document.getElementById('roomTitleInput');
const roomDescriptionInput = document.getElementById('roomDescription');
const narratorEmailsInput = document.getElementById('narratorEmails');
const speakerNamesInput = document.getElementById('speakerNames');
const roomProfileImageInput = document.getElementById('roomProfileImage');
const roomBackgroundImageInput = document.getElementById('roomBackgroundImage');
const roomBackgroundPatternInput = document.getElementById('roomBackgroundPattern');

const manageRoomModal = document.getElementById('manageRoomModal');
const closeManageModalBtn = document.getElementById('closeManageModalBtn');
const editRoomTitle = document.getElementById('editRoomTitle');
const editRoomDescription = document.getElementById('editRoomDescription');
const narratorList = document.getElementById('narratorList');
const speakerList = document.getElementById('speakerList');
const deleteRoomBtn = document.getElementById('deleteRoomBtn');
const cancelManageBtn = document.getElementById('cancelManageBtn');
const saveRoomBtn = document.getElementById('saveRoomBtn');
const editRoomProfileImageInput = document.getElementById('editRoomProfileImage');
const editRoomBackgroundImageInput = document.getElementById('editRoomBackgroundImage');
const editRoomBackgroundPatternInput = document.getElementById('editRoomBackgroundPattern');

const roomInfoModal = document.getElementById('roomInfoModal');
const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');
const infoRoomTitle = document.getElementById('infoRoomTitle');
const infoRoomDescription = document.getElementById('infoRoomDescription');
const infoCreatedDate = document.getElementById('infoCreatedDate');
const infoNarrators = document.getElementById('infoNarrators');
const infoSpeakers = document.getElementById('infoSpeakers');
const infoMessageCount = document.getElementById('infoMessageCount');
const closeInfoBtn = document.getElementById('closeInfoBtn');

const shareRoomModal = document.getElementById('shareRoomModal');
const closeShareModalBtn = document.getElementById('closeShareModalBtn');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const shareEmail = document.getElementById('shareEmail');
const speakerName = document.getElementById('speakerName');
const addNarratorBtn = document.getElementById('addNarratorBtn');
const addSpeakerBtn = document.getElementById('addSpeakerBtn');
const shareNarratorList = document.getElementById('shareNarratorList');
const closeShareBtn = document.getElementById('closeShareBtn');

const settingsBtn = document.getElementById('settingsBtn');
const shareBtn = document.getElementById('shareBtn');
const infoBtn = document.getElementById('infoBtn');

const selectSpeakerBtn = document.getElementById('selectSpeakerBtn');
const speakerSelector = document.getElementById('speakerSelector');
const speakerDropdown = document.getElementById('speakerDropdown');

const imageSelectorModal = document.getElementById('imageSelectorModal');
const closeImageSelectorBtn = document.getElementById('closeImageSelectorBtn');
const imageFileInput = document.getElementById('imageFileInput');
const imageLinkBtn = document.getElementById('imageLinkBtn');
const imageSelectorList = document.getElementById('imageSelectorList');
const selectedImagePreview = document.getElementById('selectedImagePreview');
const imageUploadStatus = document.getElementById('imageUploadStatus');
const confirmImageSelectorBtn = document.getElementById('confirmImageSelectorBtn');
const cancelImageSelectorBtn = document.getElementById('cancelImageSelectorBtn');

let selectedImageUrl = null;
let imageCallbackFn = null;

const selectRoomProfileImageBtn = document.getElementById('selectRoomProfileImageBtn');
const selectRoomBackgroundImageBtn = document.getElementById('selectRoomBackgroundImageBtn');
const selectEditRoomProfileImageBtn = document.getElementById('selectEditRoomProfileImageBtn');
const selectEditRoomBackgroundImageBtn = document.getElementById('selectEditRoomBackgroundImageBtn');

const REGEX = {
    link: /\[link\:([^\s\[\]]+)\]/gi,
    image: /\[image\:([^\s\[\]]+)\]/gi,
    video: /\[video\:([^\s\[\]]+)\]/gi,
    music: /\[music\:([^\s\[\]]+)\]/gi,
    css: /%\{([^\s\{\}]+)\}([^\{\}]+)%/gi,
};

const params = new URLSearchParams(window.location.search);
const paramRoomId = params.get('room') || false;