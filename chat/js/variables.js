let chatRooms = [];
let currentRoom = null;
let messagesUnsubscribe = null;
let roomsUnsubscribe = null;
let selectedParticipant = 'me';
let commandHistory = [];

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
const participantEmailsInput = document.getElementById('participantEmails');
const roomProfileImageInput = document.getElementById('roomProfileImage');
const roomBackgroundImageInput = document.getElementById('roomBackgroundImage');
const roomBackgroundPatternInput = document.getElementById('roomBackgroundPattern');

const manageRoomModal = document.getElementById('manageRoomModal');
const closeManageModalBtn = document.getElementById('closeManageModalBtn');
const editRoomTitle = document.getElementById('editRoomTitle');
const editRoomDescription = document.getElementById('editRoomDescription');
const participantsList = document.getElementById('participantsList');
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
const infoParticipants = document.getElementById('infoParticipants');
const infoMessageCount = document.getElementById('infoMessageCount');
const closeInfoBtn = document.getElementById('closeInfoBtn');

const shareRoomModal = document.getElementById('shareRoomModal');
const closeShareModalBtn = document.getElementById('closeShareModalBtn');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const shareEmail = document.getElementById('shareEmail');
const addParticipantBtn = document.getElementById('addParticipantBtn');
const shareParticipantsList = document.getElementById('shareParticipantsList');
const closeShareBtn = document.getElementById('closeShareBtn');

const settingsBtn = document.getElementById('settingsBtn');
const shareBtn = document.getElementById('shareBtn');
const infoBtn = document.getElementById('infoBtn');

const roomContextMenu = document.getElementById('roomContextMenu');
const editRoomMenuItem = document.getElementById('editRoomMenuItem');
const leaveRoomMenuItem = document.getElementById('leaveRoomMenuItem');

const selectParticipantBtn = document.getElementById('selectParticipantBtn');
const participantSelector = document.getElementById('participantSelector');
const participantDropdown = document.getElementById('participantDropdown');

const params = new URLSearchParams(window.location.search);
const paramRoomId = params.get('room') || false;