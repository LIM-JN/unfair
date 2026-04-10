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

  const isATurn = gameState.currentPlayer === 'A';

  // B턴이면 무조건 둘 다 비활성화
  if (!isATurn) {
    throwBtn.disabled = true;
    moveBtn.disabled = true;
    return;
  }

  // A턴일 때만 기존 로직 적용
  throwBtn.disabled = gameState.move > 0;
  moveBtn.disabled = gameState.move <= 0;
}

function switchTurn() {
  gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';

  updateTurnUI();
  updateButtons();

  if (gameState.currentPlayer === 'B') {
    setTimeout(runAITurn, 700);
  }
}

function updateTurnUI() {
  const el = document.getElementById('turnText');
  const isATurn = gameState.currentPlayer === 'A';

  el.textContent = isATurn ? 'A (PLAYER)' : 'B (CPU)';
  el.style.color = isATurn ? 'crimson' : 'royalblue';
}

function updatePieceSelectUI() {
  const isATurn = gameState.currentPlayer === 'A';

  document.querySelectorAll('input[name="p1"]').forEach(el => {
    el.disabled = !isATurn;
  });

  document.querySelectorAll('input[name="p2"]').forEach(el => {
    el.disabled = true;
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

// 이동핵심


function processMove() {
  if (gameState.isGameOver) return false;

  if (gameState.move <= 0) {
    return false;
  }

  const moved = moveSelectedPiece(gameState.move);

  if (!moved) {
    return false;
  }

  const move = gameState.move;
  gameState.move = 0;

  if (!gameState.isGameOver && move !== 4 && move !== 5 && !moved.didCapture) {
    switchTurn();
  }

  updateTurnUI();
  updateButtons();
  updatePieceSelectUI();
  resetYutDisplay();

  return true;
}

const moveBtn = document.querySelector('#moveBtn');

moveBtn.addEventListener('click', () => {
  if (gameState.move <= 0) {
    alert('먼저 윷을 던져서 이동값을 정하세요.');
    return;
  }

  processMove();
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


///////////////////// 적 플레이어 로직 

function runAITurn() {
  if (gameState.isGameOver) return;
  if (gameState.currentPlayer !== 'B') return;

  throwYut();

  setTimeout(() => {
    // 여기서 AI가 말 선택
    selectBestAIPiece();

    setTimeout(() => {
      processMove();

      // 윷/모/잡기면 B턴이 유지될 수 있으니까 재귀적으로 다시 검사
      if (!gameState.isGameOver && gameState.currentPlayer === 'B') {
        setTimeout(runAITurn, 600);
      }
    }, 500);
  }, 800);
}


function selectBestAIPiece() {
  const movablePieces = getMovableAIPieces();

  if (movablePieces.length === 0) return null;

  let bestPiece = null;
  let bestScore = -Infinity;

  for (const piece of movablePieces) {
    const score = evaluateAIMove(piece, gameState.move);
    console.log(piece.id, 'score =', score);

    if (score > bestScore) {
      bestScore = score;
      bestPiece = piece;
    }
  }

  if (!bestPiece) return null;

  const radio = document.querySelector(`input[name="p2"][value="${bestPiece.id}"]`);
  if (radio) radio.checked = true;

  return bestPiece;
}

// 핵심의사결정원인

function evaluateAIMove(piece, move) {
  let score = 0;

  const nextPos = getSimulatedPosition(piece, move);

  if (nextPos === 'goal') {
    score += 30;
  }

  if (canCaptureAt(nextPos, 'A')) {
    score += 100;
  }

  if (canStackAt(nextPos, 'B', piece.id)) {
    score += 40;
  }

  if (hasStackedFollowers(piece)) {
    score += 50;
  }

  if (isShortcutEntry(piece, move)) {
    score += 60;
  }

  if (isSafePosition(nextPos)) {
    score += 30;
  }

  // 기존 위험 감점 대신 변화 점수 반영
  score += getDangerChangeScore(piece, nextPos, 'A');

  return score;
}


function getMovableAIPieces() {
  return Object.values(pieces).filter(piece =>
    piece.position !== 'goal' &&
    piece.player === 'B' && 
    piece.leaderId === null
  );
}

function selectAIPiece(pieceId) {
  const radio = document.querySelector(`input[name="p2"][value="${pieceId}"]`);
  if (!radio) return false;

  radio.checked = true;
  return true;
}

function getSimulatedPosition(piece, moveCount) {
  let pos = piece.position;
  let prev = piece.prev;
  let useBranch = [5, 10, 103].includes(pos);

  for (let i = 0; i < moveCount; i++) {
    let next;

    if (pos === 5) {
      next = useBranch ? 101 : 6;
    } else if (pos === 10) {
      next = useBranch ? 201 : 11;
    } else if (pos === 103) {
      if (prev === 102) next = useBranch ? 203 : 104;
      else if (prev === 202) next = 203;
    } else {
      next = boardPath[pos]?.next ?? null;
    }

    if (next === null || next === undefined) break;

    // 분기 사용 후 끄기
    if (
      (pos === 5 && next === 101) ||
      (pos === 10 && next === 201) ||
      (pos === 103 && prev === 102 && next === 203)
    ) {
      useBranch = false;
    }

    prev = pos;
    pos = next;

    if (pos === 'goal') break;
  }

  return pos;
}

function getPossibleNextStates(pos, prev) {
  const states = [];

  if (pos === 5) {
    states.push({ pos: 6, prev: 5 });
    states.push({ pos: 101, prev: 5 });
    return states;
  }

  if (pos === 10) {
    states.push({ pos: 11, prev: 10 });
    states.push({ pos: 201, prev: 10 });
    return states;
  }

  if (pos === 103) {
    if (prev === 102) {
      states.push({ pos: 104, prev: 103 });
      states.push({ pos: 203, prev: 103 });
      return states;
    }

    if (prev === 202) {
      states.push({ pos: 203, prev: 103 });
      return states;
    }
  }

  const next = boardPath[pos]?.next;
  if (next !== undefined && next !== null) {
    states.push({ pos: next, prev: pos });
  }

  return states;
}

function getDistance(piece, targetPos, maxSteps = 20) {
  const queue = [
    {
      pos: piece.position,
      prev: piece.prev,
      dist: 0
    }
  ];

  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.pos}_${current.prev}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (current.pos === targetPos) {
      return current.dist;
    }

    if (current.dist >= maxSteps) continue;

    const nextStates = getPossibleNextStates(current.pos, current.prev);

    for (const nextState of nextStates) {
      queue.push({
        pos: nextState.pos,
        prev: nextState.prev,
        dist: current.dist + 1
      });
    }
  }

  return Infinity;
}

function isDangerPosition(targetPos, enemyPlayer) {
  if (targetPos === 0 || targetPos === 'goal') return false;

  const enemyPieces = Object.values(pieces).filter(piece =>
    piece.player === enemyPlayer &&
    piece.position !== 0 &&
    piece.position !== 'goal' &&
    piece.leaderId === null
  );

  for (const enemy of enemyPieces) {
    const dist = getDistance(enemy, targetPos, 3);

    if (dist >= 1 && dist <= 3) {
      return true;
    }
  }

  return false;
}

function canCaptureAt(targetPos, enemyPlayer) {
  if (targetPos === 0 || targetPos === 'goal') return false;

  return Object.values(pieces).some(piece =>
    piece.player === enemyPlayer &&
    piece.position === targetPos &&
    piece.position !== 0 &&
    piece.position !== 'goal' &&
    piece.leaderId === null
  );
}

function isShortcutEntry(piece, move) {
  const pos = piece.position;

  // 시뮬레이션 결과 확인
  const nextPos = getSimulatedPosition(piece, move);

  // 5 → 101
  if (nextPos === 5) return true;

  // 10 → 201
  if (nextPos === 10) return true;

  // 103 → 203 (102에서 온 경우만)
  if ( pos >= 101 && pos <= 102 && nextPos === 203) return true;
  if ( pos === 5 && nextPos === 203) return true;

  return false;
}

function isSafePosition(pos) {
  const safePositions = [101, 102, 201, 202];

  return safePositions.includes(pos);
}

function canStackAt(targetPos, player, movingPieceId) {
  if (targetPos === 0 || targetPos === 'goal') return false;

  return Object.values(pieces).some(piece =>
    piece.player === player &&
    piece.id !== movingPieceId &&
    piece.position === targetPos &&
    piece.position !== 0 &&
    piece.position !== 'goal' &&
    piece.leaderId === null
  );
}

function hasStackedFollowers(piece) {
  return Object.values(pieces).some(other =>
    other.leaderId === piece.id
  );
}

function getDangerChangeScore(piece, nextPos, enemyPlayer) {
  if (piece.position === 0 || piece.position === 'goal') {
    return isDangerPosition(nextPos, enemyPlayer) ? -80 : 0;
  }

  const currentDanger = isDangerPosition(piece.position, enemyPlayer);
  const nextDanger = isDangerPosition(nextPos, enemyPlayer);

  if (currentDanger && nextDanger) return 0;
  if (currentDanger && !nextDanger) return 50;
  if (!currentDanger && nextDanger) return -80;

  return 0;
}

