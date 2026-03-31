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
  { id: 'A1', player: 'A', position: 1, prev: null },
  { id: 'A2', player: 'A', position: 1, prev: null },
  { id: 'B1', player: 'B', position: 10, prev: 9 }
];

const gameState = {
  move: 0,
  resultName: '',
  pieces: [
    {
      id: 'A1',
      position: 0,
      prev: null
    }
  ]
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
  const values = [];

  for (let i = 0; i < 4; i++) {
    const isFront = Math.random() < 0.5;
    values.push(isFront ? 'O' : 'X');
  }

  stickEls.forEach((el, idx) => {
    el.textContent = values[idx];
  });

  const frontCount = values.filter(v => v === 'O').length;
  const result = getYutResult(frontCount);
  const move = frontCount === 0 ? 5 : frontCount;

  gameState.move = move;
  gameState.resultName = result;

  resultText.textContent = `결과: ${values.join('')} → ${result} (${move}칸)`;
}

throwBtn.addEventListener('click', throwYut);

const board = document.querySelector('.board');
const pieceEl = document.querySelector('.piece');

function getNodeCenter(nodeId) {
  const nodeEl = document.querySelector(`[data-node="${nodeId}"]`);
  const boardRect = board.getBoundingClientRect();
  const nodeRect = nodeEl.getBoundingClientRect();

  return {
    x: nodeRect.left - boardRect.left + nodeRect.width / 2,
    y: nodeRect.top - boardRect.top + nodeRect.height / 2
  };
}

function movePieceTo(nodeId) {
  const { x, y } = getNodeCenter(nodeId);

  pieceEl.style.left = `${x - pieceEl.offsetWidth / 2}px`;
  pieceEl.style.top = `${y - pieceEl.offsetHeight / 2}px`;
}

function movePiece(piece, moveCount) {
  const useBranch = [5, 10, 103].includes(piece.position);

  for (let i = 0; i < moveCount; i++) {
    const next = getNextPosition(piece.position, piece.prev, useBranch);

    if (next === null || next === undefined) break;

    piece.prev = piece.position;
    piece.position = next;

    if (next === 'goal') break;
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
  if (piece.position === 'goal') {
    pieceEl.style.display = 'none';
    return;
  }

  pieceEl.style.display = 'block';

  const { x, y } = getNodeCenter(piece.position);

  pieceEl.style.left = `${x - pieceEl.offsetWidth / 2}px`;
  pieceEl.style.top = `${y - pieceEl.offsetHeight / 2}px`;
}


const moveBtn = document.querySelector('#moveBtn');

moveBtn.addEventListener('click',() => {
    const piece = gameState.pieces[0];

  if (gameState.move <= 0) {
    alert('먼저 윷을 던져서 이동값을 정하세요.');
    return;
  }

  movePiece(piece, gameState.move);
  renderPiece(piece);

  gameState.move = 0;
})