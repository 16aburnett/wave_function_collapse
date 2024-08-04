// Wave Function Collapse - just a fun project to see if I can impl WFC
// This was inspired by The Coding Train's youtube video on WFC:
// https://www.youtube.com/watch?v=rI_y2GAlQFM
// I had watched Daniel's explanation of WFC and decided to try to
// implement it by myself before watching his solution and was successful!
// By Amy Burnett
//========================================================================
// Globals

const TILE_EMPTY = -1;
const TILE_BLANK =  0;
const TILE_UP    =  1;
const TILE_DOWN  =  2;
const TILE_LEFT  =  3;
const TILE_RIGHT =  4;
const TILE_PLUS  =  5;
const NUM_TILES = 6;

let num_tile_rows = 10;
let num_tile_cols = 10;
let board = [];
let tile_width  = 10;
let tile_height = 10;

// stores the actual images for a tile
let tile_images = Array (NUM_TILES).fill (null);

// stores the possible tile candidates for each cell of the board
let tile_candidates = [];

let DIR_NORTH = 0;
let DIR_EAST  = 1;
let DIR_SOUTH = 2;
let DIR_WEST  = 3;
// Keeps track of which tiles can be placed in either direction for each kind of tile
// this method is gross and not scalable if we had many more tile types
let tile_compatibilities = Array (NUM_TILES);
// HAS_UP    = [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_LEFT]
// HAS_RIGHT = [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_DOWN]
// HAS_DOWN  = [TILE_PLUS, TILE_RIGHT, TILE_DOWN, TILE_LEFT]
// HAS_LEFT  = [TILE_PLUS, TILE_UP, TILE_DOWN, TILE_LEFT]
tile_compatibilities[TILE_BLANK] = [
    [TILE_BLANK, TILE_UP], // NORTH
    [TILE_BLANK, TILE_RIGHT], // EAST
    [TILE_BLANK, TILE_DOWN], // SOUTH
    [TILE_BLANK, TILE_LEFT]  // WEST
];
tile_compatibilities[TILE_PLUS] = [
    [TILE_PLUS, TILE_RIGHT, TILE_DOWN, TILE_LEFT], // NORTH
    [TILE_PLUS, TILE_UP, TILE_DOWN, TILE_LEFT], // EAST
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_LEFT], // SOUTH
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_DOWN]  // WEST
];
tile_compatibilities[TILE_UP] = [
    [TILE_PLUS, TILE_RIGHT, TILE_DOWN, TILE_LEFT], // NORTH
    [TILE_PLUS, TILE_UP, TILE_DOWN, TILE_LEFT], // EAST
    [TILE_BLANK, TILE_DOWN], // SOUTH
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_DOWN]  // WEST
];
tile_compatibilities[TILE_RIGHT] = [
    [TILE_PLUS, TILE_RIGHT, TILE_DOWN, TILE_LEFT], // NORTH
    [TILE_PLUS, TILE_UP, TILE_DOWN, TILE_LEFT], // EAST
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_LEFT], // SOUTH
    [TILE_BLANK, TILE_LEFT]  // WEST
];
tile_compatibilities[TILE_DOWN] = [
    [TILE_BLANK, TILE_UP], // NORTH
    [TILE_PLUS, TILE_UP, TILE_DOWN, TILE_LEFT], // EAST
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_LEFT], // SOUTH
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_DOWN]  // WEST
];
tile_compatibilities[TILE_LEFT] = [
    [TILE_PLUS, TILE_RIGHT, TILE_DOWN, TILE_LEFT], // NORTH
    [TILE_BLANK, TILE_RIGHT], // EAST
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_LEFT], // SOUTH
    [TILE_PLUS, TILE_UP, TILE_RIGHT, TILE_DOWN]  // WEST
];


let num_naturally_collapsed = 0;
let num_forced_collapsed = 0;

//========================================================================

function preload () {
    tile_images[TILE_BLANK] = loadImage ('resources/blank.png');
    tile_images[TILE_PLUS ] = loadImage ('resources/plus.png');
    tile_images[TILE_UP   ] = loadImage ('resources/up.png');
    tile_images[TILE_DOWN ] = loadImage ('resources/down.png');
    tile_images[TILE_LEFT ] = loadImage ('resources/left.png');
    tile_images[TILE_RIGHT] = loadImage ('resources/right.png');
}

//========================================================================

function setup ()
{
    // Create a full screen square canvas
    // we want the canvas to be square so use whatever is the more constrained dim
    let smallestDimension = min (windowWidth * 0.50 - 10, windowHeight * 0.75 - 20);
    createCanvas (smallestDimension, smallestDimension);
    tile_width = smallestDimension / num_tile_cols;
    tile_height = smallestDimension / num_tile_rows;

    // Initialize the board with blank tiles
    for (let i = 0; i < num_tile_rows; ++i)
    {
        board.push ([]);
        tile_candidates.push ([]);
        for (let j = 0; j < num_tile_cols; ++j)
        {
            // board[i].push (floor (random (0, NUM_TILES)));
            board[i].push (TILE_EMPTY);
            tile_candidates[i].push ([]);
        }
    }
}

//========================================================================

function draw ()
{
    background ("#eee");

    apply_wave_function_collapse_step ();

    // Draw tiles
    for (let i = 0; i < num_tile_rows; ++i)
    {
        for (let j = 0; j < num_tile_cols; ++j)
        {
            // Ensure there is a valid tile at this cell
            if (board[i][j] == TILE_EMPTY)
            {
                // Draw a black tile to denote a missing tile
                let x = j * tile_width;
                let y = i * tile_height;
                fill (0);
                rect (x, y, tile_width, tile_height);
                continue;
            }
            // Draw tile
            let x = j * tile_width;
            let y = i * tile_height;
            stroke (0);
            image (tile_images[board[i][j]], x, y, tile_width, tile_height);
        }
    }

    // console.log (num_naturally_collapsed, num_forced_collapsed);

}

//========================================================================

function windowResized ()
{
    // we want the canvas to be square so use whatever is the more constrained dim
    let smallestDimension = min (windowWidth * 0.50 - 10, windowHeight * 0.75 - 20);
    resizeCanvas(smallestDimension, smallestDimension);
    // Resize tiles
    tile_width = smallestDimension / num_tile_cols;
    tile_height = smallestDimension / num_tile_rows;
}

//========================================================================

// Wave function collapse algo
// 1. determine all tile candidates per cell
    // a tile is possible if it does not conflict with any surrounding tiles
// 2. collapse cells that only have a single candidate
// 3. if no collapse occurred, then collapse one cell with the lowest entropy (num candidates)
// 4. repeat until board is solved
// 5. if board is not solvable, then backtrack?
function apply_wave_function_collapse_step ()
{
    // Ensure board is not already filled in
    if (is_board_filled_in ()) return;
    // Determine tile candidates for each cell
    for (let i = 0; i < num_tile_rows; ++i)
    {
        for (let j = 0; j < num_tile_cols; ++j)
        {
            // Clear previous tile candidates
            tile_candidates[i][j] = [];
            // Ensure cell was not already collapsed
            if (board[i][j] != TILE_EMPTY)
                continue;
            // Check each type of tile if it can go in this cell
            for (let tile_candidate = 0; tile_candidate < NUM_TILES; ++tile_candidate)
            {
                // Ensure tile candidate agrees with NORTH tile, if exists and is filled in
                if (i > 0 && board[i-1][j] != TILE_EMPTY && !tile_compatibilities[board[i-1][j]][DIR_SOUTH].includes (tile_candidate))
                {
                    // tile candidate is not compatible with NORTH tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with EAST tile, if exists and is filled in
                if (j+1 < num_tile_cols && board[i][j+1] != TILE_EMPTY && !tile_compatibilities[board[i][j+1]][DIR_WEST].includes (tile_candidate))
                {
                    // tile candidate is not compatible with EAST tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with SOUTH tile, if exists and is filled in
                if (i+1 < num_tile_rows && board[i+1][j] != TILE_EMPTY && !tile_compatibilities[board[i+1][j]][DIR_NORTH].includes (tile_candidate))
                {
                    // tile candidate is not compatible with SOUTH tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with EAST tile, if exists and is filled in
                if (j > 0 && board[i][j-1] != TILE_EMPTY && !tile_compatibilities[board[i][j-1]][DIR_EAST].includes (tile_candidate))
                {
                    // tile candidate is not compatible with EAST tile
                    // skip to next tile candidate
                    continue;
                }
                // Reaches here if tile candidate is compatible with any filled-in neighboring tiles
                // add to candidate list
                tile_candidates[i][j].push (tile_candidate);
            }
        }
    }

    // Collapse any cells that have a single candidate
    let has_collapsed = false;
    for (let i = 0; i < num_tile_rows && !has_collapsed; ++i)
    {
        for (let j = 0; j < num_tile_cols && !has_collapsed; ++j)
        {
            // Ensure cell is empty
            if (board[i][j] != TILE_EMPTY)
                continue;
            // Ensure cell has only 1 candidate to be able to collapse it
            if (tile_candidates[i][j].length != 1)
                // more than one or zero candidates so we cannot collapse
                continue;
            // Collapse cell
            board[i][j] = tile_candidates[i][j][0];
            has_collapsed = true;
            // debug
            num_naturally_collapsed++;
        }
    }

    // If no tiles were collapsed, then force a cell to collapse
    if (has_collapsed == false)
    {
        // determine which cells have the lowest entropy (lowest num candidates)
        let lowest_entropy = NUM_TILES;
        let lowest_entropy_cells = []; // stores [i,j] for each cell of the lowest entropy set
        for (let i = 0; i < num_tile_rows && !has_collapsed; ++i)
        {
            for (let j = 0; j < num_tile_cols && !has_collapsed; ++j)
            {
                // Ensure cell is empty
                if (board[i][j] != TILE_EMPTY)
                    continue;
                // Ensure cell has candidates - unsolvable if it doesnt
                if (tile_candidates[i][j].length == 0)
                    // Board is unsolvable
                    // we could/should stop here, but just keep checking to collapse whatever else we can
                    continue;
                // check if entropy is lower than the current lowest entropy
                let entropy = tile_candidates[i][j].length;
                if (entropy < lowest_entropy)
                {
                    lowest_entropy = entropy;
                    lowest_entropy_cells = [[i,j]];
                }
                // check if entropy is the same as the current lowest entropy
                else if (entropy == lowest_entropy)
                {
                    lowest_entropy_cells.push ([i,j]);
                }
            }
        }

        // Ensure there was a cell to collapse - if not, then the board is not solvable from here
        if (lowest_entropy_cells.length > 0)
        {
            // Pick a random cell from the lowest entropy set and collapse it to a random candidate
            let [i, j] = random (lowest_entropy_cells);
            board[i][j] = random (tile_candidates[i][j]);
            has_collapsed = true;
            // debug
            num_forced_collapsed++;
        }
    }
}

//========================================================================

// returns true if all cells have tiles, false otherwise
function is_board_filled_in ()
{
    for (let i = 0; i < num_tile_rows; ++i)
    {
        for (let j = 0; j < num_tile_cols; ++j)
        {
            // Ensure cell is filled in
            if (board[i][j] == TILE_EMPTY)
                // Found a tile that is still empty, board is not filled in
                return false;
        }
    }
    // Did not find any empty cells, so the board is filled in
    return true;
}
