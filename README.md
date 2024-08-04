# Wave Function Collapse
This project was inspired by The Coding Train's youtube video on WFC:
https://www.youtube.com/watch?v=rI_y2GAlQFM
I had watched Daniel's explanation of WFC and decided to try to implement it by myself before watching his solution, and I was successful!

This project uses the method of Wave Function Collapse to generate random structured images using tiles/images to describe distinct features. Wave Function Collapse uses predefined tile-to-tile compatibilities to determine candidate tiles for positions in the image and will place a tile (referred to as "collapsing") if there is only a single possible candidate for a given cell. If there are no cells with just one possible candidate, then WFC randomly chooses a cell from a set of the lowest entropy (aka least number of candidates) cells and collapses that cell with a random candidate.


# Credit

Circuit tiles are from https://github.com/mxgmn/WaveFunctionCollapse/tree/master. These are the same tiles that were used in the Coding Train WFC coding challenge video.
