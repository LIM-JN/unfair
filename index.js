const boardPath = {
  0: { next: 1 },
  1: { next: 2 },
  2: { next: 3 },
  3: { next: 4 },
  4: { next: 5 },
  5: { next: 6, branch: 101 },
  6: { next: 7 },
  7: { next: 8 },
  8: { next: 9 },
  9: { next: 10 },
  10: { next: 11, branch: 201 },
  11: { next: 12 },
  12: { next: 13 },
  13: { next: 14 },
  14: { next: 15 },
  15: { next: 16 },
  16: { next: 17 },
  17: { next: 18 },
  18: { next: 19 },
  19: { next: 20 },
  20: { next: 'goal' },
  101: { next: 102 },
  102: { next: 103 },
  103: {
    nextFrom: {
      102: 104,
      202: 203
    }
  },
  104: { next: 105 },
  105: { next: 15 },
  201: { next: 202 },
  202: { next: 103 },
  203: { next: 204 },
  204: { next: 20 }
};


const pieces = [
  { id: 'A1', player: 'A', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false},
  { id: 'A2', player: 'A', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false },
  { id: 'A3', player: 'A', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false },
  { id: 'A4', player: 'A', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false },
  { id: 'B1', player: 'B', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false },
  { id: 'B2', player: 'B', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false },
  { id: 'B3', player: 'B', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false},
  { id: 'B4', player: 'B', position: 0, prev: null, isHome: true, leaderId: null, stackedIds: [], isStackHidden: false }
];

const gameState = {
  move: 0,
  currentPlayer: 'A',
  isGameOver: false
};


function getNextNode(current, prev = null) {
  const node = boardPath[current];

  if (!node) return null;

  if (node.nextFrom && prev !== null) {
    return node.nextFrom[prev];
  }

  return node.next ?? null;
}

const throwBtn = document.getElementById('throwBtn');
const resultText = document.getElementById('resultText');
const stickEls = [
  document.getElementById('stick1'),
  document.getElementById('stick2'),
  document.getElementById('stick3'),
  document.getElementById('stick4')
];

function getYutResult(frontCount) {
  switch (frontCount) {
    case 0:
      return '모';
    case 1:
      return '도';
    case 2:
      return '개';
    case 3:
      return '걸';
    case 4:
      return '윷';
    default:
      return '';
  }
}


function throwYut() {
  if (gameState.isGameOver) return;

  if (gameState.move > 0) {
    alert('먼저 말을 움직여주세요.');
    return;
  }

  throwBtn.disabled = true;
  resultText.textContent = '결과: 던지는 중...';

  const animation = setInterval(() => {
    stickEls.forEach(el => {
      el.textContent = Math.random() < 0.5 ? 'O' : 'X';
    });
  }, 40);

  setTimeout(() => {
    clearInterval(animation);

    const values = [];

    for (let i = 0; i < 4; i++) {
      const isFront = Math.random() < 0.5;
      values.push(isFront ? 'O' : 'X');
    }

    stickEls.forEach((el, idx) => {
      el.textContent = values[idx];
    });

    const frontCount = values.filter(v => v === 'O').length;
    const move = frontCount === 0 ? 5 : frontCount;
    const result = getYutResult(frontCount);

    gameState.move = move;
    resultText.textContent = `결과: ${values.join('')} → ${result} (${move}칸)`;

    updateButtons();
  }, 400);
}

function resetYutDisplay() {
  stickEls.forEach((el) => {
    el.textContent = '?';
  });

  resultText.textContent = '결과: -';
}

throwBtn.addEventListener('click', throwYut);

const board = document.querySelector('.board');

function getNodeCenter(nodeId) {
  const nodeEl = document.querySelector(`[data-node="${nodeId}"]`);
  const boardRect = board.getBoundingClientRect();

  if (!nodeEl) {
    console.warn(`data-node="${nodeId}" 요소를 찾을 수 없습니다.`);
    return null;
  }

  const nodeRect = nodeEl.getBoundingClientRect();

  return {
    x: nodeRect.left - boardRect.left + nodeRect.width / 2,
    y: nodeRect.top - boardRect.top + nodeRect.height / 2
  };
}


function movePiece(piece, moveCount) {
  let useBranch = [5, 10, 103].includes(piece.position);

  for (let i = 0; i < moveCount; i++) {
    const current = piece.position;
    const next = getNextPosition(current, piece.prev, useBranch);

    if (next === null || next === undefined) break;

    // 숏컷을 실제로 사용한 순간 이후에는 끈다
    if (
      (current === 5 && next === 101) ||
      (current === 10 && next === 201) ||
      (current === 103 && piece.prev === 102 && next === 203)
    ) {
      useBranch = false;
    }

    piece.prev = current;
    piece.position = next;


    if (next === 'goal') {
        handleScore(piece);
        break;
    }
  }
}

function handleScore(piece) {
  const stackedIds = [...piece.stackedIds];
  const totalCount = 1 + stackedIds.length;

  addScore(piece.player, totalCount);

  stackedIds.forEach(stackedId => {
    const stackedPiece = pieces.find(p => p.id === stackedId);
    if (!stackedPiece) return;

    sendPieceGoal(stackedPiece);
  });

  sendPieceGoal(piece);

  checkWinner(piece.player);
}

function checkWinner(player) {
  const scoreId = player === 'A' ? 'score1' : 'score2';
  const score = Number(document.getElementById(scoreId).textContent);

  if (score >= 4) {
    gameState.isGameOver = true;

    document.getElementById('gameMessage').textContent = `${player} 플레이어 승리!`;
    alert(`${player} 플레이어 승리!`);

    updateButtons();
  }
}

function getNextPosition(current, prev = null, useBranch = false) {
  if (current === 5) {
    return useBranch ? 101 : 6;
  }

  if (current === 10) {
    return useBranch ? 201 : 11;
  }

  if (current === 103) {
    if (prev === 102) return useBranch ? 203 : 104;
    if (prev === 202) return 203;
  }

  return boardPath[current]?.next ?? null;
}

function renderPiece(piece) {
  const pieceEl = document.getElementById(`piece-${piece.id}`);
  if (!pieceEl) return;

  if (piece.isStackHidden || piece.position === 0 || piece.position === 'goal') {
    pieceEl.classList.add('is-home');
    return;
  }

  const pos = getNodeCenter(piece.position);
  if (!pos) return;

  pieceEl.classList.remove('is-home');
  pieceEl.style.left = `${pos.x - pieceEl.offsetWidth / 2}px`;
  pieceEl.style.top = `${pos.y - pieceEl.offsetHeight / 2}px`;

  const stackSize = piece.stackedIds.length;
  pieceEl.textContent = stackSize > 0 ? `${piece.id}+${stackSize}` : piece.id;
}


function moveSelectedPiece(moveCount) {
  const radioName = gameState.currentPlayer === 'A' ? 'p1' : 'p2';
  const selected = document.querySelector(`input[name="${radioName}"]:checked`);

  if (!selected) {
    alert('말을 선택해주세요.');
    return false;
  }

  const piece = pieces.find(
    p => p.id === selected.value && p.player === gameState.currentPlayer
  );

  if (!piece) {
    alert('선택한 말을 찾을 수 없습니다.');
    return false;
  }

  if (piece.position === 'goal') {
    alert('이미 완주한 말입니다.');
    return false;
  }

  if (piece.leaderId !== null) {
    alert('업혀 있는 말은 직접 움직일 수 없습니다.');
    return false;
  }

  if (piece.isHome) {
    piece.isHome = false;
  }

  movePiece(piece, moveCount);
  syncStackedPieces(piece);
  renderPiece(piece);

  const didCapture = captureOpponentPieces(piece);
  const stackedCount = stackFriendlyPieces(piece);

  syncStackedPieces(piece);
  renderPiece(piece);

  return {
    moved: true,
    didCapture,
    didStack: stackedCount > 0
  };
}

function updateButtons() {
  if (gameState.isGameOver) {
    throwBtn.disabled = true;
    moveBtn.disabled = true;
    return;
  }

  throwBtn.disabled = gameState.move > 0;
  moveBtn.disabled = gameState.move <= 0;
}

function switchTurn() {
  gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
}

function updateTurnUI() {
  document.getElementById('turnText').textContent = gameState.currentPlayer;
}

function updatePieceSelectUI() {
  const isATurn = gameState.currentPlayer === 'A';

  document.querySelectorAll('input[name="p1"]').forEach(el => {
    el.disabled = !isATurn;
  });

  document.querySelectorAll('input[name="p2"]').forEach(el => {
    el.disabled = isATurn;
  });
}

function captureOpponentPieces(movedPiece) {
  let captured = false;
  const processedLeaderIds = new Set();

  pieces.forEach(piece => {
    if (piece.id === movedPiece.id) return;
    if (piece.player === movedPiece.player) return;
    if (piece.position === 0 || piece.position === 'goal') return;
    if (piece.position !== movedPiece.position) return;

    const targetLeader = piece.leaderId
      ? pieces.find(p => p.id === piece.leaderId)
      : piece;

    if (!targetLeader) return;
    if (processedLeaderIds.has(targetLeader.id)) return;

    processedLeaderIds.add(targetLeader.id);
    sendStackHome(targetLeader);
    captured = true;
  });

  return captured;
}

const moveBtn = document.querySelector('#moveBtn');

moveBtn.addEventListener('click', () => {
  if (gameState.isGameOver) return;

  if (gameState.move <= 0) {
    alert('먼저 윷을 던져서 이동값을 정하세요.');
    return;
  }

  const moved = moveSelectedPiece(gameState.move);

  if (!moved) {
    return;
  }

  const move = gameState.move;
  gameState.move = 0;

  if (!gameState.isGameOver && move !== 4 && move !== 5 && !moved.didCapture) {
    switchTurn();
  }

  updateTurnUI();
  updatePieceSelectUI();
  resetYutDisplay();
  updateButtons();
});

////////// 업기 추가 코드

function stackFriendlyPieces(movedPiece) {
  let addedCount = 0;
  const mergedIds = new Set(movedPiece.stackedIds);

  pieces.forEach(piece => {
    if (piece.id === movedPiece.id) return;
    if (piece.player !== movedPiece.player) return;
    if (piece.position !== movedPiece.position) return;
    if (piece.position === 0 || piece.position === 'goal') return;

    // 업혀 있는 말은 직접 처리하지 말고 대표만 처리
    if (piece.leaderId !== null) return;

    // piece는 같은 칸의 "대표 말" 또는 단독 말
    const idsToMerge = [piece.id, ...piece.stackedIds];

    idsToMerge.forEach(id => {
      if (mergedIds.has(id)) return;

      const targetPiece = pieces.find(p => p.id === id);
      if (!targetPiece) return;

      mergedIds.add(id);
      movedPiece.stackedIds.push(id);

      targetPiece.leaderId = movedPiece.id;
      targetPiece.isStackHidden = true;
      targetPiece.position = movedPiece.position;
      targetPiece.prev = movedPiece.prev;

      // 대표였던 말은 이제 대표가 아니므로 자기 stackedIds 비움
      if (targetPiece.id === piece.id) {
        targetPiece.stackedIds = [];
      }

      renderPiece(targetPiece);
      addedCount += 1;
    });
  });

  renderPiece(movedPiece);
  return addedCount;
}

function syncStackedPieces(leaderPiece) {
  leaderPiece.stackedIds.forEach(stackedId => {
    const stackedPiece = pieces.find(piece => piece.id === stackedId);
    if (!stackedPiece) return;

    stackedPiece.position = leaderPiece.position;
    stackedPiece.prev = leaderPiece.prev;
  });
}

function sendPieceGoal(piece) {
  piece.position = 'goal';
  piece.prev = null;
  piece.isHome = false;
  piece.leaderId = null;
  piece.stackedIds = [];
  piece.isStackHidden = false;

  renderPiece(piece);
}

function sendStackHome(leaderPiece) {
  const stackedIds = [...leaderPiece.stackedIds];

  stackedIds.forEach(stackedId => {
    const stackedPiece = pieces.find(piece => piece.id === stackedId);
    if (!stackedPiece) return;

    sendPieceHome(stackedPiece);
  });

  sendPieceHome(leaderPiece);
}

function addScore(player, amount = 1) {
  const scoreId = player === 'A' ? 'score1' : 'score2';
  const scoreEl = document.getElementById(scoreId);

  scoreEl.textContent = Number(scoreEl.textContent) + amount;
}

function sendPieceHome(piece) {

  const pos = getNodeCenter(20)
  const pieceEl = document.getElementById(`piece-${piece.id}`);
  if (!pieceEl) return;

  pieceEl.style.left = `${pos.x - pieceEl.offsetWidth / 2}px`;
  pieceEl.style.top = `${pos.y - pieceEl.offsetHeight / 2}px`;

  piece.position = 0;
  piece.prev = null;
  piece.isHome = true;
  piece.leaderId = null;
  piece.stackedIds = [];
  piece.isStackHidden = false;

  renderPiece(piece);
}