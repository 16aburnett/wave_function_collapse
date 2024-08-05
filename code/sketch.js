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
const EDGE_BLANK = "0";
const EDGE_WIRE  = "1";
// Circuit Tile edge types
// This idea of using a coded string to represent matching sides
// comes from an issue on the Coding Train's github:
// https://github.com/CodingTrain/Wave-Function-Collapse/issues/16
// This solves the problem with asymmetric tiles where we do not want
// asymmetric tiles matching with themselves.
// a code of "300" would only be able to match with its reverse "003"
// so it cannot match itself. But a code like "111" can match itself.
// Solving a symmetry problem with symmetry!!
const EDGE_CIRCUIT_SUBSTRATE        = "000";
const EDGE_CIRCUIT_COMPONENT        = "111";
const EDGE_CIRCUIT_CORNER_LEFT      = "200";
const EDGE_CIRCUIT_CORNER_DOWN      = "002";
const EDGE_CIRCUIT_CONNECTION_RIGHT = "002";
const EDGE_CIRCUIT_CONNECTION_LEFT  = "200";
const EDGE_CIRCUIT_GREEN_TRACK      = "444";
const EDGE_CIRCUIT_GREY_WIRE        = "555";

// Enumeration of orthogonally neighboring cells
const DIR_NORTH = 0;
const DIR_EAST  = 1;
const DIR_SOUTH = 2;
const DIR_WEST  = 3;

let num_tile_rows = 16;
let num_tile_cols = num_tile_rows;
let tile_width  = 10;
let tile_height = tile_width;
let board = [];
// board_history stores previous boards to be restored in the event that a
// random move yielded an unsolvable board. In which case, we can
// backtrack and restore the board state and try another tile.
// if we run out of tiles, then backtrack further since none of the
// candidates lead to valid boards.
// if nothing to backtrack to, then it is impossible to solve with the
// given tiles - highly unlikely.
// each element is [<prev_board>, <i,j>, <list_of_next_candidates>]
let board_history = [];

// stores the possible tile candidates for each cell of the board
let tile_candidates = [];

// stores static data representing different tile images
// and rotated variants of nonsymmetric tiles
let tile_types = [];

//========================================================================

// preload runs before setup
function preload () {
    // Basic Tiles
    // tile_types.push (new Tile (
    //     loadImage ('resources/blank.png'),
    //     0,
    //     [EDGE_BLANK, EDGE_BLANK, EDGE_BLANK, EDGE_BLANK]
    // ));
    // tile_types.push (new Tile (
    //     loadImage ('resources/up.png'),
    //     0,
    //     [EDGE_WIRE , EDGE_WIRE , EDGE_BLANK, EDGE_WIRE ]
    // ));
    // tile_types.push (new Tile (
    //     loadImage ('resources/plus.png'),
    //     0,
    //     [EDGE_WIRE , EDGE_WIRE , EDGE_WIRE , EDGE_WIRE ]
    // ));

    // Circuit Tiles
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/bridge.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREY_WIRE, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREY_WIRE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/component.png'),
        0,
        [EDGE_CIRCUIT_COMPONENT, EDGE_CIRCUIT_COMPONENT, EDGE_CIRCUIT_COMPONENT, EDGE_CIRCUIT_COMPONENT]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/connection.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_CONNECTION_RIGHT, EDGE_CIRCUIT_COMPONENT, EDGE_CIRCUIT_CONNECTION_LEFT]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/corner.png'),
        0,
        [EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_CORNER_DOWN, EDGE_CIRCUIT_CORNER_LEFT]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/dskew.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/skew.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/substrate.png'),
        0,
        [EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/t.png'),
        0,
        [EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/track.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/transition.png'),
        0,
        [EDGE_CIRCUIT_GREY_WIRE, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/turn.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/viad.png'),
        0,
        [EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREEN_TRACK]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/vias.png'),
        0,
        [EDGE_CIRCUIT_GREEN_TRACK, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_SUBSTRATE]
    ));
    tile_types.push (new Tile (
        loadImage ('resources/Circuit/wire.png'),
        0,
        [EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREY_WIRE, EDGE_CIRCUIT_SUBSTRATE, EDGE_CIRCUIT_GREY_WIRE]
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
        if (tile_types[t].edge_types[0] === tile_types[t].edge_types[1] &&
            tile_types[t].edge_types[1] === tile_types[t].edge_types[2] &&
            tile_types[t].edge_types[2] === tile_types[t].edge_types[3])
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
    // frameRate (1);
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
                // Draw a tiny version of each tile candidate for this cell
                // Since we want to arrange the tiles in a square
                // we need to fit the tiles in a grid of the
                // next nearest square root.
                let tile_candidate_rows = Math.ceil (Math.sqrt (tile_types.length));
                let tile_candidate_cols = tile_candidate_rows;
                let tile_candidate_padding = tile_width / tile_candidate_cols * .1;
                let tile_candidate_width  = tile_width  / tile_candidate_cols - tile_candidate_padding * 2;
                let tile_candidate_height = tile_height / tile_candidate_rows - tile_candidate_padding * 2;
                for (let ci = 0; ci < tile_candidate_rows; ++ci)
                {
                    for (let cj = 0; cj < tile_candidate_cols; ++cj)
                    {
                        // Ensure within bounds - not every cell will have all possibilities
                        if ((ci * tile_candidate_cols + cj) >= tile_candidates[i][j].length)
                            continue;
                        // Draw tile candidate
                        let tile_candidate = tile_candidates[i][j][ci * tile_candidate_cols + cj];
                        let cx = x + cj * tile_candidate_width + (cj+1) * tile_candidate_padding;
                        let cy = y + ci * tile_candidate_height + (ci+1) * tile_candidate_padding;
                        push ();
                        translate (cx + tile_candidate_width/2, cy + tile_candidate_height/2);
                        imageMode(CENTER);
                        rotate (tile_types[tile_candidate].image_rotation);
                        image (tile_types[tile_candidate].image, 0, 0, tile_candidate_width, tile_candidate_height);
                        pop ();
                    }
                }
                continue;
            }
            // Draw tile
            let x = j * tile_width;
            let y = i * tile_height;
            push ();
            translate (x + tile_width/2, y + tile_height/2);
            imageMode(CENTER);
            rotate (tile_types[board[i][j]].image_rotation);
            image (tile_types[board[i][j]].image, 0, 0, tile_width, tile_height);
            pop ();
            // Tile borders lines for debug
            // noFill ();
            // stroke (0);
            // rect (x, y, tile_width, tile_height);
        }
    }

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
                if (i > 0 && board[i-1][j] != TILE_EMPTY && !do_edge_types_match (tile_types[board[i-1][j]].edge_types[DIR_SOUTH], tile_types[tile_candidate].edge_types[DIR_NORTH]))
                {
                    // tile candidate is not compatible with NORTH tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with EAST tile, if exists and is filled in
                if (j+1 < num_tile_cols && board[i][j+1] != TILE_EMPTY && !do_edge_types_match (tile_types[board[i][j+1]].edge_types[DIR_WEST], tile_types[tile_candidate].edge_types[DIR_EAST]))
                {
                    // tile candidate is not compatible with EAST tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with SOUTH tile, if exists and is filled in
                if (i+1 < num_tile_rows && board[i+1][j] != TILE_EMPTY && !do_edge_types_match (tile_types[board[i+1][j]].edge_types[DIR_NORTH], tile_types[tile_candidate].edge_types[DIR_SOUTH]))
                {
                    // tile candidate is not compatible with SOUTH tile
                    // skip to next tile candidate
                    continue;
                }
                // Ensure tile candidate agrees with EAST tile, if exists and is filled in
                if (j > 0 && board[i][j-1] != TILE_EMPTY && !do_edge_types_match (tile_types[board[i][j-1]].edge_types[DIR_EAST], tile_types[tile_candidate].edge_types[DIR_WEST]))
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
            // Ensure cell has candidates - unsolvable if it doesnt
            if (tile_candidates[i][j].length == 0)
            {
                // Board is unsolvable
                // stop here and backtrack - no sense moving forward
                backtrack ();
                return;
            }
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
        // determine which cells have the lowest entropy
        // (lowest num candidates)
        let lowest_entropy = tile_types.length;
        // stores [i,j] for each cell of the lowest entropy set
        let lowest_entropy_cells = []; 
        for (let i = 0; i < num_tile_rows && !has_collapsed; ++i)
        {
            for (let j = 0; j < num_tile_cols && !has_collapsed; ++j)
            {
                // Ensure cell is empty
                if (board[i][j] != TILE_EMPTY)
                    continue;
                // Ensure cell has candidates - unsolvable if it doesnt
                if (tile_candidates[i][j].length == 0)
                {
                    // Board is unsolvable
                    // stop here and backtrack - no sense moving forward
                    backtrack ();
                    return;
                }
                // check if entropy is lower than the current lowest
                // entropy
                let entropy = tile_candidates[i][j].length;
                if (entropy < lowest_entropy)
                {
                    lowest_entropy = entropy;
                    lowest_entropy_cells = [[i,j]];
                }
                // check if entropy is the same as the current lowest
                // entropy
                else if (entropy == lowest_entropy)
                {
                    lowest_entropy_cells.push ([i,j]);
                }
            }
        }
        // Ensure there was a cell to collapse
        // - if not, then the board is not solvable from here
        // not sure if this is needed as we also check for unsolvable
        // while building the lowest entropy set
        if (lowest_entropy_cells.length == 0)
        {
            // board is not solvable
            // backtrack and try a different random candidate
            console.log ("No cells to collapse - backtracking");
            backtrack ();
            // skip to the next WFC step
            return;
        }
        // Pick a random cell from the lowest entropy set and
        // collapse it to a random one of its candidates
        let [i, j] = random (lowest_entropy_cells);
        let randomly_chosen_tile = random (tile_candidates[i][j]);
        board[i][j] = randomly_chosen_tile;
        has_collapsed = true;
        // we picked a random tile - this can lead to an unsolvable board
        // so save the previous board state for backtracking later
        let new_candidates = JSON.parse (JSON.stringify (tile_candidates[i][j]));
        // remove the chosen candidate from the candidates list so we dont
        // try the same candidate again.
        new_candidates.splice (new_candidates.indexOf (randomly_chosen_tile), 1);
        board_history.push ([
            JSON.parse (JSON.stringify (board)),
            [i,j],
            new_candidates]);
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
                // Found a tile that is still empty,
                // board is not filled in
                return false;
        }
    }
    // Did not find any empty cells, so the board is filled in
    return true;
}

//========================================================================

// checks if two edge type codes match
// Edge type codes match if code string A matches the reverse of code
// string B. Reversing the string is a solution to asymmetric sides
// matching themselves and looking visually wrong.
function do_edge_types_match (edge_type_a, edge_type_b)
{
    // Ensure string lengths match - otherwise strings will not match
    if (edge_type_a.length != edge_type_b.length)
            return false;
    let edge_type_b_reversed = edge_type_b.split ('').reverse (). join ("");
    // Check each char to see if strings match
    for (let i = 0; i < edge_type_a.length; ++i)
    {
        if (edge_type_a[i] !== edge_type_b_reversed[i])
        {
            // found a char that does not match!
            // codes do not match
            return false;
        }
    }
    // did not find a different char - all chars are same - strings match
    return true;
}

//========================================================================

// This restores the previous board state that was saved when we made a
// random move. Use this as soon as something unsolvable shows up like
// zero candidates for a cell. This allows us to try all possible
// permutations until we land on a finished board.
function backtrack ()
{
    console.log ("Backtracking")
    // Ensure something to backtrack to
    if (board_history.length == 0)
    {
        // not possible to solve - this is highly unlikely
        console.log ("Tried all possible permutations - not solvable with this tileset");
        return;
    }
    let [previous_state, [i,j], next_candidates] = board_history[board_history.length-1];
    // Ensure previous state has another candidate to try
    if (next_candidates.length == 0)
    {
        // previous state has no path forward
        // remove this saved state and backtracking further
        // no sense restoring this saved state as it will fail
        console.log ("no more candidates, backtracking further");
        board_history.pop ();
        return;
    }
    // restore board state
    console.log ("restoring previous board state");
    // *Using JSON to do a deep copy of the board state
    // replace current board with previous board
    board = JSON.parse (JSON.stringify (previous_state));
    // try a different tile
    let new_tile = random (next_candidates);
    console.log ("trying new tile: ", new_tile);
    board[i][j] = new_tile;
    // remove tile from candidates list so we do not try it again in the
    // future, since that would cause an infinite loop
    next_candidates.splice (next_candidates.indexOf (new_tile), 1);

}