// Wave Function Collapse - TileSet class
// the TileSet class defines static data about sets of Tiles
// Example: Sudoku tileset has 0-9 digit tiles with Sudoku constraints
// Example: Picture tilesets have tile images that have edge socket codes
//    that determine which tiles are allowed to be adjacent to each other
// By Amy Burnett
//========================================================================
// Globals


//========================================================================

class TileSet
{
    // is_valid_function must have (i, j, tile_num) parameters
    constructor (tiles, is_valid_function)
    {
        this.tiles = tiles;
        this.is_valid_function = is_valid_function;
    }
}
