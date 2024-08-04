// Wave Function Collapse - just a fun project to see if I can impl WFC
// This was inspired by The Coding Train's youtube video on WFC:
// https://www.youtube.com/watch?v=rI_y2GAlQFM
// I had watched Daniel's explanation of WFC and decided to try to
// implement it by myself before watching his solution and was successful!
// By Amy Burnett
//========================================================================
// Globals

// Enumeration of the different types of tiles
const TILE_EMPTY = -1;

// Enumeration of the different types of tile edge connections
// Only blank edges can match with blank edges
// and only wire edges can match with wire edges
const EDGE_BLANK = 0;
const EDGE_WIRE  = 1;

// Enumeration of orthogonally neighboring cells
const DIR_NORTH = 0;
const DIR_EAST  = 1;
const DIR_SOUTH = 2;
const DIR_WEST  = 3;

let num_tile_rows = 10;
let num_tile_cols = 10;
let board = [];
let tile_width  = 10;
let tile_height = 10;

// stores the possible tile candidates for each cell of the board
let tile_candidates = [];

// stores static data representing different tile images
// and rotated variants of nonsymmetric tiles
let tile_types = [];

//========================================================================

// preload runs before setup
function preload () {
    tile_types.push (new Tile (
        loadImage ('resources/blank.png'),
        0,
        [EDGE_BLANK, EDGE_BLANK, EDGE_BLANK, EDGE_BLANK]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/up.png'),
        0,
        [EDGE_WIRE , EDGE_WIRE , EDGE_BLANK, EDGE_WIRE ]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/plus.png'),
        0,
        [EDGE_WIRE , EDGE_WIRE , EDGE_WIRE , EDGE_WIRE ]
    ));
}

//========================================================================

function setup ()
{
    // Create a full screen square canvas
    // we want the canvas to be square so use whatever is the more constrained dim
    let smallestDimension = min (windowWidth, windowHeight);
    createCanvas (smallestDimension, smallestDimension);
    tile_width = smallestDimension / num_tile_cols;
    tile_height = smallestDimension / num_tile_rows;
    angleMode(DEGREES);

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

    // Generate rotated versions of tiles
    // 1. determine if rotating tile would result in a different image
    // 2. if so, then rotate it four ways and add each rotation as a new tile
    // iterate backwards since we are possibly adding to tile_types
    for (let t = tile_types.length - 1; t >= 0; --t)
    {
        // determine if rotating this tile would result in a different image
        // we know it will be the same image if the all the edge types are the same
        // since rotating it will not create a different edge type pattern
        if (tile_types[t].edge_types[0] == tile_types[t].edge_types[1] &&
            tile_types[t].edge_types[1] == tile_types[t].edge_types[2] &&
            tile_types[t].edge_types[2] == tile_types[t].edge_types[3])
        {
            // all edge types are the same
            // assume this is perfectly symmetrical so no need to rotate
            continue;
        }
        // Image can be rotated
        // Create 0, 90, 180, 270 degree versions (0 is already done)
        // 90 degrees means vector pointing up changes to pointing right
        //   ^
        //   |   ->  ---->
        //   |
        // 90 degrees (1 turn)
        tile_types.push (new Tile (tile_types[t].image, 90, [
            tile_types[t].edge_types[DIR_WEST],
            tile_types[t].edge_types[DIR_NORTH],
            tile_types[t].edge_types[DIR_EAST],
            tile_types[t].edge_types[DIR_SOUTH]]));
        // 180 degrees (2 turns)
        tile_types.push (new Tile (tile_types[t].image, 180, [
            tile_types[t].edge_types[DIR_SOUTH],
            tile_types[t].edge_types[DIR_WEST],
            tile_types[t].edge_types[DIR_NORTH],
            tile_types[t].edge_types[DIR_EAST]]));
        // 270 degrees (3 turns)
        tile_types.push (new Tile (tile_types[t].image, 270, [
            tile_types[t].edge_types[DIR_EAST],
            tile_types[t].edge_types[DIR_SOUTH],
            tile_types[t].edge_types[DIR_WEST],
            tile_types[t].edge_types[DIR_NORTH]]));
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
            push ();
            stroke (0);
            translate (x + tile_width/2, y + tile_height/2);
            imageMode(CENTER);
            rotate (tile_types[board[i][j]].image_rotation);
            image (tile_types[board[i][j]].image, 0, 0, tile_width, tile_height);
            pop ();
        }
    }

    // console.log (num_naturally_collapsed, num_forced_collapsed);

}

//========================================================================

function windowResized ()
{
    // we want the canvas to be square so use whatever is the more constrained dim
    let smallestDimension = min (windowWidth, windowHeight);
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
            for (let tile_candidate = 0; tile_candidate < tile_types.length; ++tile_candidate)
            {
                // Ensure tile candidate agrees with NORTH tile, if exists and is filled in
                if (i > 0 && board[i-1][j] != TILE_EMPTY && tile_types[board[i-1][j]].edge_types[DIR_SOUTH] != tile_types[tile_candidate].edge_types[DIR_NORTH])
                {
                    // tile candidate is not compatible with NORTH tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with EAST tile, if exists and is filled in
                if (j+1 < num_tile_cols && board[i][j+1] != TILE_EMPTY && tile_types[board[i][j+1]].edge_types[DIR_WEST] != tile_types[tile_candidate].edge_types[DIR_EAST])
                {
                    // tile candidate is not compatible with EAST tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with SOUTH tile, if exists and is filled in
                if (i+1 < num_tile_rows && board[i+1][j] != TILE_EMPTY && tile_types[board[i+1][j]].edge_types[DIR_NORTH] != tile_types[tile_candidate].edge_types[DIR_SOUTH])
                {
                    // tile candidate is not compatible with SOUTH tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with EAST tile, if exists and is filled in
                if (j > 0 && board[i][j-1] != TILE_EMPTY && tile_types[board[i][j-1]].edge_types[DIR_EAST] != tile_types[tile_candidate].edge_types[DIR_WEST])
                {
                    // tile candidate is not compatible with EAST tile
                    // skip to next tile candidate
                    continue;
                }
                // Reaches here if tile candidate is compatible with all filled-in neighboring tiles
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
        }
    }

    // If no tiles were collapsed, then force a cell to collapse
    if (has_collapsed == false)
    {
        // determine which cells have the lowest entropy (lowest num candidates)
        let lowest_entropy = tile_types.length;
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
