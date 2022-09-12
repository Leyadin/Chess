var canvas, ctx, board;
var highlight, check;
var xClick, yClick;
var whitePieces, blackPieces;
var turn, comp;
var possibleMoves, gameMoves, enPassant, enPassantCapture;
var evalCounter;


const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

var imageList = {
        bPawn: 'b_p.png',
        bKnight: 'b_kn.png',
		bBishop: 'b_b.png',
		bRook: 'b_r.png',
		bQueen: 'b_q.png',
		bKing: 'b_k.png',
		wPawn: 'w_p.png',
		wKnight: 'w_kn.png',
		wBishop: 'w_b.png',
		wRook: 'w_r.png',
		wQueen: 'w_q.png',
		wKing: 'w_k.png'
      };

function init() {
	//Default variables
	highlight = false, check = false;
	turn = 0;
	gameMoves = [];
	enPassant = 0;
	enPassantCapture = false;
	comp = false;
	
	//Generate and populate a 2d array representation of the chess board
	generatePieces();
	
	canvas = document.getElementById('myCanvas');
	ctx = canvas.getContext('2d');
	ctx.lineWidth = 5;
	
	//Draw the board
	draw();
	
	possibleMoves = findAllMoves(turn, 1);
	
	//Primary user interaction
	canvas.addEventListener("click", takeAction, false);
}

function compOn() {
	comp = true;
}

function takeAction(e) {
	if (highlight == false) {
		//Set xClick and yClick to the corner of the square clicked
		xClick = Math.floor(e.clientX / 100) * 100;
		yClick = Math.floor(e.clientY / 100) * 100;
		//Highlight the square
		if (turn % 2 == 0 && whitePieces.includes(board[yClick / 100][xClick / 100],1) ||
			turn % 2 == 1 && blackPieces.includes(board[yClick / 100][xClick / 100],1)) {
			ctx.strokeStyle = 'yellow';
			ctx.strokeRect(xClick + 2.5, yClick + 2.5, 95, 95);
			highlight = true;
		}
	} else {
		var newX = Math.floor(e.clientX / 100) * 100;
		var newY = Math.floor(e.clientY / 100) * 100;
		//Unhighlight the square if it is clicked on again
		if (newX == xClick && newY == yClick) {
			//Reset brown
			if (xClick % 200 != yClick % 200) {ctx.strokeStyle = '#D28B2A';} //Light brown
			//Reset white
			else {ctx.strokeStyle = 'white';}
			ctx.strokeRect(xClick + 2.5, yClick + 2.5, 95, 95);
			highlight = false;
		}
		//Select a different square
		else if (turn % 2 == 0 && whitePieces.includes(board[newY /100][newX / 100],1) ||
			turn % 2 == 1 && blackPieces.includes(board[newY / 100][newX / 100],1)) {
			//Unhighlight the old square
			//Reset brown
			if (xClick % 200 != yClick % 200) {ctx.strokeStyle = '#D28B2A';} //Light brown
			//Reset white
			else {ctx.strokeStyle = 'white';}
			ctx.strokeRect(xClick + 2.5, yClick + 2.5, 95, 95);
			
			//Highlight the new square
			xClick = newX;
			yClick = newY;
			ctx.strokeStyle = 'yellow';
			ctx.strokeRect(xClick + 2.5, yClick + 2.5, 95, 95);
			highlight = true;
		}
		//Make the move (if possible)
		else {
			highlight = movePiece(yClick/100, xClick/100, Math.floor(e.clientY / 100), Math.floor(e.clientX / 100));
			check = isCheck(turn + 1);
			possibleMoves = findAllMoves(turn, 1);
			//End game condition
			if (possibleMoves.length == 0) {
				return;
			}
			
			if (comp == true && turn % 2 == 1) {
				evalCounter = 0;
				//Find the computer's move
				var move = compTurn();
				//Make the computer's move
				highlight = movePiece(move[0], move[1], move[2], move[3]);
				//Highlight the computer's move red
				ctx.strokeStyle = 'red';
				ctx.strokeRect(move[3] * 100 + 2.5, move[2] * 100 + 2.5, 95, 95);
				//Find if the king is in check
				check = isCheck(turn + 1);
				//Generate a list of all possible moves
				possibleMoves = findAllMoves(turn, 1);
				//End game condition
				if (possibleMoves.length == 0) {
				}
			}
		}
	}
	
}

function movePiece(startRow, startCol, endRow, endCol) {
	var tempMove = [startRow, startCol, endRow, endCol];
	//Check if the proposed move is valid, move the piece if so
	if (matchMove(tempMove)) {
		//Move the piece
		board[endRow][endCol] = board[startRow][startCol];
		//Clear the space the piece came from
		board[startRow][startCol] = 0;
		
		//Special rule for en passant
		if (enPassantCapture == true) {
			//Remove the capture piece
			board[startRow][endCol] = 0;
			enPassantCapture = false;
		}
		
		//Promotion
		//Black
		if (board[endRow][endCol] == 1 && endRow == 7) {
			board[endRow][endCol] = 5;
		} 
		//White
		else if (board[endRow][endCol] == 7 && endRow == 0) {
			board[endRow][endCol] = 11;
		}
		
		//Special rules for king
		//Black
		if (startRow == board[8][0] && startCol == board[8][1]) {
			//Update king position
			board[8][0] = endRow;
			board[8][1] = endCol;
			//Turn off castling after a king move
			board[8][2] = 0; 
			board[8][3] = 0;
			
			//Castling
			if (startCol - endCol == 2) {
				//Move the rook too
				board[0][3] = 4;
				board[0][0] = 0;
			} else if (startCol - endCol == -2) {
				board[0][5] = 4;
				board[0][7] = 0;
			}
		} 
		//White
		else if (startRow == board[8][4] && startCol == board[8][5]) {
			//Update king position
			board[8][4] = endRow;
			board[8][5] = endCol;
			//Turn off castling after a king move
			board[8][6] = 0; 
			board[8][7] = 0;
			
			//Castling
			if (startCol - endCol == 2) {
				//Move the rook too
				board[7][3] = 10;
				board[7][0] = 0;
			} else if (startCol - endCol == -2) {
				board[7][5] = 10;
				board[7][7] = 0;
			}
		} 
		//Disable castling due to rook move
		else if (startRow == 0 && startCol == 0) {board[8][2] = 0;} 
		else if (startRow == 0 && startCol == 7) {board[8][3] = 0;} 
		else if (startRow == 7 && startCol == 0) {board[8][6] = 0;} 
		else if (startRow == 7 && startCol == 7) {board[8][7] = 0;}
		//Enable en passant if valid
		//Turn off the flag
		if (enPassant != 0) {enPassant = 0;}
		//Black
		if (startRow - 2 == endRow && board[endRow][endCol] == 7) {enPassant = 1;} 
		//White
		else if (startRow + 2 == endRow && board[endRow][endCol] == 1) {enPassant = 2;}
		//Record the move
		gameMoves.push([startRow, startCol, endRow, endCol]);
		turn++;
		draw();
		return false;
	};
	
	return true;
}

//Verify that the proposed move from mouse click matches a legal move
function matchMove(move) {
	for (var i = 0; i < possibleMoves.length; i++) {
		for (var j = 0; j < 4; j++) {
			if (possibleMoves[i][j] != move[j]) {break;}
			if (j == 3) {
				//Flag if the move is an en passant capture
				if (possibleMoves[i][4] != null) {enPassantCapture = true;}
				return true;
			}
		}
	}
	
	return false;
}

function simMove(startRow, startCol, endRow, endCol) {
	if (startRow == board[8][0] && startCol == board[8][1]) {
		//Update black king position
		board[8][0] = endRow;
		board[8][1] = endCol;
		board[8][2] = 0; //turn off castling
		board[8][3] = 0;
	} else if (startRow == board[8][4] && startCol == board[8][5]) {
		//Update white king position
		board[8][4] = endRow;
		board[8][5] = endCol;
		board[8][6] = 0; //turn off castling
		board[8][7] = 0;
	} 
	//Disable castling due to rook move
	else if (startRow == 0 && startCol == 0) {board[8][2] = 0;} 
	else if (startRow == 0 && startCol == 7) {board[8][3] = 0;}
	else if (startRow == 7 && startCol == 0) {board[8][6] = 0;} 
	else if (startRow == 7 && startCol == 7) {board[8][7] = 0;}
	
	board[endRow][endCol] = board[startRow][startCol];
	board[startRow][startCol] = 0;
	
	//Promotion
	//Black
	if (board[endRow][endCol] == 1 && endRow == 7) {
		board[endRow][endCol] = 5;
	} 
	//White
	else if (board[endRow][endCol] == 7 && endRow == 0) {
		board[endRow][endCol] = 11;
	}
}

function undoMove(startRow, startCol, endRow, endCol, castle) {
	if (startRow == board[8][0] && startCol == board[8][1]) {
		//Update black king position
		board[8][0] = endRow;
		board[8][1] = endCol;
	} else if (startRow == board[8][4] && startCol == board[8][5]) {
		//Update white king position
		board[8][4] = endRow;
		board[8][5] = endCol;
	}
	
	//Reset castling flags to what they were
	board[8][2] = castle[0];
	board[8][3] = castle[1];
	board[8][6] = castle[2];
	board[8][7] = castle[3];
	
	board[endRow][endCol] = board[startRow][startCol];
	board[startRow][startCol] = 0;
}

function generatePieces() {
	//1 = pawn, 2 = knight, 3 = bishop, 4 = rook, 5 = queen, 6 = king
	blackPieces = [];
	blackPieces.push(0);
	blackPieces.push(1);
	blackPieces.push(2);
	blackPieces.push(3);
	blackPieces.push(4);
	blackPieces.push(5);
	blackPieces.push(6);
	//7 = pawn, 8 = knight, 9 = bishop, 10 = rook, 11 = queen, 12 = king
	whitePieces = [];
	whitePieces.push(0);
	whitePieces.push(7);
	whitePieces.push(8);
	whitePieces.push(9);
	whitePieces.push(10);
	whitePieces.push(11);
	whitePieces.push(12);
	
	board = new Array(9);
	for (var i = 0; i < 8; i++){
		board[i] = new Array(8);
		
		for (var j = 0; j < 8; j++) {
			board[i][j] = 0;
		}
	}
	board[0][0] = 4;
	board[0][1] = 2;
	board[0][2] = 3;
	board[0][3] = 5;
	board[0][4] = 6;
	board[0][5] = 3;
	board[0][6] = 2;
	board[0][7] = 4;
	board[7][0] = 10;
	board[7][1] = 8;
	board[7][2] = 9;
	board[7][3] = 11;
	board[7][4] = 12;
	board[7][5] = 9;
	board[7][6] = 8;
	board[7][7] = 10;
	for (var i = 0; i < 8; i++) {
			board[1][i] = 1;
			board[6][i] = 7;
	}
	//King position is stored on row 8
	board[8] = new Array(8);
	//Black king is (board[8][0], board[8][1])
	//board[8][2] is a flag for if queen side castling is allowed (1 = yes)
	//board[8][4] is king side castling
	board[8][0] = 0;
	board[8][1] = 4;
	board[8][2] = 1;
	board[8][3] = 1;
	//White king is (board[8][4], board[8][5])
	//board[8][6] is a flag for if queen side castling is allowed (1 = yes)
	//board[8][7] is king side castling
	board[8][4] = 7;
	board[8][5] = 4;
	board[8][6] = 1;
	board[8][7] = 1;
}

function loadImages(imageList, callback) {
	var images = {};
	var loadedImages = 0;
	var numImages = Object.keys(imageList).length;
		
	for(var i in imageList) {
		images[i] = new Image();
		images[i].onload = function() {
			if(++loadedImages >= numImages) {callback(images);}
		};
		//Create a list of imageObjects
		images[i].src = imageList[i];
	}
}

function draw() {
	//Draw the board
	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	ctx.fillStyle = '#D28B2A'; //Light brown
	
	for (var x = 0; x < 8; x++) {
		for (var y = 0; y < 8; y++) {
			if (x % 2 != y % 2) {
				ctx.fillRect(x * CANVAS_WIDTH/8, y * CANVAS_HEIGHT/8, CANVAS_WIDTH/8, CANVAS_HEIGHT/8);
			}
		}
	}
	
	//Draw the pieces
	loadImages(imageList, function(images) {
		for (var i = 0; i < 8; i++) {
			for (var j = 0; j < 8; j++) {
				var row = j * CANVAS_WIDTH/8;
				var col = i * CANVAS_HEIGHT/8;
				
				switch (board[i][j]) {
					case 1:
						ctx.drawImage(images.bPawn, row, col);
						break;
					case 2:
						ctx.drawImage(images.bKnight, row, col);
						break;
					case 3:
						ctx.drawImage(images.bBishop, row, col);
						break;
					case 4:
						ctx.drawImage(images.bRook, row, col);
						break;
					case 5:
						ctx.drawImage(images.bQueen, row, col);
						break;
					case 6:
						ctx.drawImage(images.bKing, row, col);
						break;
					case 7:
						ctx.drawImage(images.wPawn, row, col);
						break;
					case 8:
						ctx.drawImage(images.wKnight, row, col);
						break;
					case 9:
						ctx.drawImage(images.wBishop, row, col);
						break;
					case 10:
						ctx.drawImage(images.wRook, row, col);
						break;
					case 11:
						ctx.drawImage(images.wQueen, row, col);
						break;
					case 12:
						ctx.drawImage(images.wKing, row, col);
						break;
					default:
						break;
				}
			}
		}
	});
	
}

function findAllMoves(player, depth) {
	//List of all possible moves
	depth--;
	var moveList = [];
	var tempRow, tempCol;
	
	for (var i = 0; i < 8; i++) {
		for (var j = 0; j < 8; j++) {
			//Black
			if (player % 2 == 1) {
				switch(board[i][j]) {
					//black pawn
					case(1):
						//Double space (Pawn hasn't moved yet)
						if (i == 1) {
							if (board[i+1][j] == 0 && board[i+2][j] == 0) {moveList.push([i, j, i+2, j]);}
						}
						//Single space
						if (board[i+1][j] == 0) {moveList.push([i, j, i+1, j]);}
						//Captures
						if ((i + 1 <= 7) && (j + 1 <= 7) && whitePieces.includes(board[i+1][j+1],1)) {moveList.push([i, j, i+1, j+1]);} 
						if (i + 1 <= 7 && j - 1 >=0 && whitePieces.includes(board[i+1][j-1],1)) {moveList.push([i, j, i+1, j-1]);}
						//En passant
						if (enPassant == 1) {
							if (gameMoves[turn - 1][2] == i && gameMoves[turn - 1][3] - 1 == j) {moveList.push([i, j, i+1, j+1, 1])} 
							else if (gameMoves[turn - 1][2] == i && gameMoves[turn - 1][3] + 1 == j) {moveList.push([i, j, i+1, j-1, 1])}
						}
						break;
					//black knight
					case(2):
						if (i - 1 >= 0) {
							if (j + 2 <= 7 && whitePieces.includes(board[i-1][j+2])) {moveList.push([i, j, i-1, j+2]);}
							if (j - 2 >= 0 && whitePieces.includes(board[i-1][j-2])) {moveList.push([i, j, i-1, j-2]);}
						}
						if (i + 1 <= 7) {
							if (j + 2 <= 7 && whitePieces.includes(board[i+1][j+2])) {moveList.push([i, j, i+1, j+2]);}
							if (j - 2 >= 0 && whitePieces.includes(board[i+1][j-2])) {moveList.push([i, j, i+1, j-2]);}
						}
						if (i + 2 <= 7) {
							if (j + 1 <= 7 && whitePieces.includes(board[i+2][j+1])) {moveList.push([i, j, i+2, j+1]);}
							if (j - 1 >= 0 && whitePieces.includes(board[i+2][j-1])) {moveList.push([i, j, i+2, j-1]);}
						}
						if (i - 2 >= 0) {
							if (j + 1 <= 7 && whitePieces.includes(board[i-2][j+1])) {moveList.push([i, j, i-2, j+1]);}
							if (j - 1 >= 0 && whitePieces.includes(board[i-2][j-1])) {moveList.push([i, j, i-2, j-1]);}
						}
						break;
					//black queen (obeys the rules of both bishop and knight)
					case(5):
					//black bishop
					case(3):
						tempRow = i, tempCol = j;
						while (++tempRow <= 7 && ++tempCol <= 7 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						tempRow = i; tempCol = j;
						while (++tempRow <= 7 && --tempCol >= 0 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						tempRow = i; tempCol = j;
						while (--tempRow >= 0 && --tempCol >= 0 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						tempRow = i; tempCol = j;
						while (--tempRow >= 0 && ++tempCol <= 7 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						if (board[i][j] == 3) {break;};
					//black rook
					case(4):
						tempRow = i, tempCol = j;
						while (++tempRow <= 7 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						tempRow = i;
						while (--tempRow >= 0 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						tempRow = i;
						while (++tempCol <= 7 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						tempCol = j;
						while (--tempCol >= 0 && whitePieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;}
						}
						break;
					//black king
					case(6):
						//Normal movement
						if (i + 1 <= 7) {
							if (j + 1 <= 7 && whitePieces.includes(board[i + 1][j + 1])) {moveList.push([i, j, i+1, j+1]);}
							if (whitePieces.includes(board[i + 1][j])) {moveList.push([i, j, i+1, j]);}
							if (j - 1 >= 0 && whitePieces.includes(board[i + 1][j - 1])) {moveList.push([i, j, i+1, j-1]);}
						}
						if (i - 1 >= 0) {
							if (j + 1 <= 7 && whitePieces.includes(board[i - 1][j + 1])) {moveList.push([i, j, i-1, j+1]);}
							if (whitePieces.includes(board[i - 1][j])) {moveList.push([i, j, i-1, j]);}
							if (j - 1 >= 0 && whitePieces.includes(board[i - 1][j - 1])) {moveList.push([i, j, i-1, j-1]);}
						}
						if (j + 1 <= 7 && whitePieces.includes(board[i][j + 1])) {moveList.push([i, j, i, j+1]);}
						if (j - 1 >= 0 && whitePieces.includes(board[i][j - 1])) {moveList.push([i, j, i, j-1]);}
						//Castling
						//If left side castling is still valid, the rook is there and there are no pieces inbetween
						if (board[8][2] == 1 && board[0][0] == 4 && board[0][1] == 0 && board[0][2] == 0 && board[0][3] == 0 && check == false) {
							//Check if the intermediate move would be put the king in check
							var temp = [];
							temp.push([i, j, i, j-1]);
							temp = verifyLegalMoves(temp, player);
							if (temp.length > 0) {
								moveList.push([i, j, i, j-2]);
							}
						}
						if (board[8][2] == 1 && board[0][7] == 4 && board[0][6] == 0 && board[0][5] == 0 && check == false) {
							var temp = [];
							temp.push([i, j, i, j+1]);
							temp = verifyLegalMoves(temp, player);
							if (temp.length > 0) {
								moveList.push([i, j, i, j+2]);
							}
						}
						break;
				}
			}
			//White
			else {
				switch(board[i][j]) {
					//white pawn
					case(7):
						//Double space
						if (i == 6) {
							if (board[i-1][j] == 0 &&board[i-2][j] == 0) {moveList.push([i, j, i-2, j]);}
						}
						//Single space
						if (board[i-1][j] == 0) {moveList.push([i, j, i-1, j]);}
						//Captures
						if (i - 1 >= 0 && j + 1 <= 7 && blackPieces.includes(board[i-1][j+1],1)) {moveList.push([i, j, i-1, j+1]);}
						if (i - 1 >= 0 && j - 1 >= 0 && blackPieces.includes(board[i-1][j-1],1)) {moveList.push([i, j, i-1, j-1]);}
						//En passant
						if (enPassant == 2) {
							if (gameMoves[turn - 1][2] == i && gameMoves[turn - 1][3] - 1 == j) {moveList.push([i, j, i-1, j+1, 1])} 
							else if (gameMoves[turn - 1][2] == i && gameMoves[turn - 1][3] + 1 == j) {moveList.push([i, j, i-1, j-1, 1])}
						}
						break;
					//white knight
					case(8):
						if (i - 1 >= 0) {
							if (j + 2 <= 7 && blackPieces.includes(board[i-1][j+2])) {moveList.push([i, j, i-1, j+2]);}
							if (j - 2 >= 0 && blackPieces.includes(board[i-1][j-2])) {moveList.push([i, j, i-1, j-2]);}
						}
						if (i + 1 <= 7) {
							if (j + 2 <= 7 && blackPieces.includes(board[i+1][j+2])) {moveList.push([i, j, i+1, j+2]);}
							if (j - 2 >= 0 && blackPieces.includes(board[i+1][j-2])) {moveList.push([i, j, i+1, j-2]);}
						}
						if (i + 2 <= 7) {
							if (j + 1 <= 7 && blackPieces.includes(board[i+2][j+1])) {moveList.push([i, j, i+2, j+1]);}
							if (j - 1 >= 0 && blackPieces.includes(board[i+2][j-1])) {moveList.push([i, j, i+2, j-1]);}
						}
						if (i - 2 >= 0) {
							if (j + 1 <= 7 && blackPieces.includes(board[i-2][j+1])) {moveList.push([i, j, i-2, j+1]);}
							if (j - 1 >= 0 && blackPieces.includes(board[i-2][j-1])) {moveList.push([i, j, i-2, j-1]);}
						}
						break;
					//white queen (obeys the rules of both bishop and rook)
					case(11):
					//white bishop
					case(9):
						tempRow = i, tempCol = j;
						while (++tempRow <= 7 && ++tempCol <= 7 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						tempRow = i; tempCol = j;
						while (++tempRow <= 7 && --tempCol >= 0 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						tempRow = i; tempCol = j;
						while (--tempRow >= 0 && --tempCol >= 0 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						tempRow = i; tempCol = j;
						while (--tempRow >= 0 && ++tempCol <= 7 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						if (board[i][j] == 9) {break;};
					//white rook
					case(10):
						tempRow = i, tempCol = j;
						while (++tempRow <= 7 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						tempRow = i;
						while (--tempRow >= 0 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						tempRow = i;
						while (++tempCol <= 7 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						tempCol = j;
						while (--tempCol >= 0 && blackPieces.includes(board[tempRow][tempCol])) {
							moveList.push([i, j, tempRow, tempCol]);
							if (board[tempRow][tempCol] != 0) {break;};
						}
						break;
					//white king
					case(12):
						if (i + 1 <= 7) {
							if (j + 1 <= 7 && blackPieces.includes(board[i + 1][j + 1])) {moveList.push([i, j, i+1, j+1]);}
							if (blackPieces.includes(board[i + 1][j])) {moveList.push([i, j, i+1, j]);}
							if (j - 1 >= 0 && blackPieces.includes(board[i + 1][j - 1])) {moveList.push([i, j, i+1, j-1]);}
						}
						if (i - 1 >= 0) {
							if (j + 1 <= 7 && blackPieces.includes(board[i - 1][j + 1])) {moveList.push([i, j, i-1, j+1]);}
							if (blackPieces.includes(board[i - 1][j])) {moveList.push([i, j, i-1, j]);}
							if (j - 1 >= 0 && blackPieces.includes(board[i - 1][j - 1])) {moveList.push([i, j, i-1, j-1]);}
						}
						if (j + 1 <= 7 && blackPieces.includes(board[i][j + 1])) {moveList.push([i, j, i, j+1]);}
						if (j - 1 >= 0 && blackPieces.includes(board[i][j - 1])) {moveList.push([i, j, i, j-1]);}
						//Castling
						//If left side castling is still valid, the rook is there and there are no pieces inbetween
						if (board[8][6] == 1 && board[7][0] == 10 && board[7][1] == 0 && board[7][2] == 0 && board[7][3] == 0 && check == false) {
							//Check if the intermediate move would be put the king in check
							var temp = [];
							temp.push([i, j, i, j-1]);
							temp = verifyLegalMoves(temp, player);
							if (temp.length > 0) {
								moveList.push([i, j, i, j-2]);
							}
						}
						if (board[8][7] == 1 && board[7][7] == 10 && board[7][6] == 0 && board[7][5] == 0 && check == false) {
							var temp = [];
							temp.push([i, j, i, j+1]);
							temp = verifyLegalMoves(temp, player);
							if (temp.length > 0) {
								moveList.push([i, j, i, j+2]);
							}
						}
						break;
					default:
						break;
				}
			}
		}
	}
	
	//Remove moves that result in the king being taken
	if (depth == 0) {
		moveList = verifyLegalMoves(moveList, player);
	}
	
	return moveList;
}

function isCheck(player) {
	moveList = findAllMoves(player, -1);
	for (var i = 0; i < moveList.length; i++) {
		//White
		if (moveList[i][2] == board[8][4] && moveList[i][3] == board[8][5]) {
			return true;
		}
		//Black
		if (moveList[i][2] == board[8][0] && moveList[i][3] == board[8][1]) {
			return true;
		}
	}
	
	return false;
}

function verifyLegalMoves(moveList, player) {
	//Backup current castling status
	var tempCastle = [board[8][2], board[8][3], board[8][6], board[8][7]];
	
	for (var i = 0; i < moveList.length; i++) {
		//Backup the piece at the start
		var tempStart = board[moveList[i][0]][moveList[i][1]];
		//Backup the piece at the end
		var tempEnd = board[moveList[i][2]][moveList[i][3]];
		//Simulate move
		simMove(moveList[i][0], moveList[i][1], moveList[i][2], moveList[i][3]);
		
		//Check if the king could be captured
		//returns true if king could be captured, false if not
		var removeMove = isCheck(player + 1);
		
		//Undo the move
		undoMove(moveList[i][2], moveList[i][3], moveList[i][0], moveList[i][1], tempCastle);
		//Replace the pieces
		board[moveList[i][0]][moveList[i][1]] = tempStart;
		board[moveList[i][2]][moveList[i][3]] = tempEnd;
		
		//Get rid of the move if the king would be captured(it's not a legal move)
		if (removeMove) {
			moveList.splice(i,1);
			i--;
		}
	}
	
	return moveList;
}

//Evalute board based on piece worth
//Pawn = 10, Knight = 30, Bishop = 30, Rook = 50, Queen = 90, King = 1000
//White is positive, Black is negative

//Note: A stronger evalution would be based on board position as well
function evaluate() {
	var value = 0;
	
	for (var i = 0; i < 8; i++) {
		for (var j = 0; j < 8; j++) {
			switch(board[i][j]) {
				case(1):
					value -= 10;
					break;
				case(2):
					value -= 30;
					break;
				case(3):
					value -= 30;
					break;
				case(4):
					value -= 50;
					break;
				case(5):
					value -= 90;
					break;
				case(6):
					value -= 1000;
					break;
				case(7):
					value += 10;
					break;
				case(8):
					value += 30;
					break;
				case(9):
					value += 30;
					break;
				case(10):
					value += 50;
					break;
				case(11):
					value += 90;
					break;
				case(12):
					value += 1000;
					break;
			}
		}
	}
	
	return value;
}

function compTurn() {
	var moveList = findAllMoves(1, 1);
	var chosenMove = [99999, moveList[0]];
	
	//Count the number of pieces on the board
	//This is used to determine the depth that will be used
	var numPieces = 0;
	for (var i = 0; i < 8; i++) {
		for (var j = 0; j < 8; j++) {
			if (board[i][j] != 0) {numPieces++;}
		}
	}
	
	//Systematically check each move
	for (var i = 0; i < moveList.length; i++) {
		//Make the proposed move
		var tempStart = board[moveList[i][0]][moveList[i][1]];
		var tempEnd = board[moveList[i][2]][moveList[i][3]];
		var tempCastle = [board[8][2], board[8][3], board[8][6], board[8][7]];
		simMove(moveList[i][0], moveList[i][1], moveList[i][2], moveList[i][3]);
		
		//Recurse
		if (numPieces < 4) {
			var points = engineWhite(7, -99999, 99999);
		} else if (numPieces >= 4 && numPieces < 8) {
			var points = engineWhite(5, -99999, 99999);
		} else if (numPieces >= 8 && numPieces < 12) {
			var points = engineWhite(4, -99999, 99999);
		} else {
			var points = engineWhite(3, -99999, 99999);
		}
		
		//If the move is the best, store it
		if (points < chosenMove[0]) {chosenMove = [points, moveList[i]];}
		
		//Undo proposed the move
		undoMove(moveList[i][2], moveList[i][3], moveList[i][0], moveList[i][1], tempCastle);
		board[moveList[i][0]][moveList[i][1]] = tempStart;
		board[moveList[i][2]][moveList[i][3]] = tempEnd;
	}
	
	return chosenMove[1];
}

function engineWhite(depth, alpha, beta) {
	if (depth == 0) {
		//Add slight randomness to the evaluation so the engine will play different moves in the same scenario
		evalCounter++;
		return evaluate() + Math.random();
	}
	
	depth--;
	var max = -99999;
	var moveList = findAllMoves(0, 1);
	
	for (var i = 0; i < moveList.length; i++) {
		//Make the proposed move
		var tempStart = board[moveList[i][0]][moveList[i][1]];
		var tempEnd = board[moveList[i][2]][moveList[i][3]];
		var tempCastle = [board[8][2], board[8][3], board[8][6], board[8][7]];
		simMove(moveList[i][0], moveList[i][1], moveList[i][2], moveList[i][3]);
		
		var points = engineBlack(depth, alpha, beta);
		
		//Undo the proposed move
		undoMove(moveList[i][2], moveList[i][3], moveList[i][0], moveList[i][1], tempCastle);
		board[moveList[i][0]][moveList[i][1]] = tempStart;
		board[moveList[i][2]][moveList[i][3]] = tempEnd;
		
		if (points > max) {max = points;}
		if (max > alpha) {alpha = max;}
		if (beta <= alpha) {break;}
	}
	
	return max;
}


function engineBlack(depth, alpha, beta) {
	if (depth == 0) {
		//Add slight randomness to the evaluation
		evalCounter++;
		return evaluate() + Math.random();
	}
	
	depth--;
	var min = 99999;
	var moveList = findAllMoves(1, 1);
	
	for (var i = 0; i < moveList.length; i++) {
		//Make the proposed move
		var tempStart = board[moveList[i][0]][moveList[i][1]];
		var tempEnd = board[moveList[i][2]][moveList[i][3]];
		var tempCastle = [board[8][2], board[8][3], board[8][6], board[8][7]];
		simMove(moveList[i][0], moveList[i][1], moveList[i][2], moveList[i][3]);
		
		var points = engineWhite(depth, alpha, beta);

		//Undo the proposed move
		undoMove(moveList[i][2], moveList[i][3], moveList[i][0], moveList[i][1], tempCastle);
		board[moveList[i][0]][moveList[i][1]] = tempStart;
		board[moveList[i][2]][moveList[i][3]] = tempEnd;
		
		if (points < min) {min = points;}
		if (min < beta) {beta = min;}
		if (alpha >= beta) {break;}
	}
	
	return min;
}



