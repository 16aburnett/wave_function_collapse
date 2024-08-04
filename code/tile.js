// Wave Function Collapse - Tile class
// the Tile class defines different static data about a kind of tile like
// the tile's image, image rotation, and edge type
// By Amy Burnett
//========================================================================
// Globals


//========================================================================

class Tile
{
    constructor (image=null, image_rotation=0, edge_types=[TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY])
    {
        // Initially starts as null, but needs to be set in preload()
        this.image = image;
        // Stores the intended rotation of the image to define this tile
        // different tiles can use the same image but be different rotations
        this.image_rotation = image_rotation;
        // Stores the edge type for the north, east, south, west edges
        this.edge_types = edge_types;
    }
}
