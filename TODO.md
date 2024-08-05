# Wave Function Collapse - notes/TODO

- make a 3D version
    - could make something that works with Minecraft to generate cool terrains or buildings?
- add in a probability parameter so that we can change how likely a tile is used
- add in more tilesets
    - and make the website have the function to switch between tilesets and a generate button
- add the option to generate edge codes based on checking pixel color
    - essentially remove a step that the user needs to do for importing a new tileset
- add the ability to analyze an already made image and to pick features to make tiles
    - essentially removing the need for users to create tiles
    - and instead this would be an image processor + recreation tool
- add a Sudoku tileset?
    - although will be more complex as it needs to check row,col,box instead of just immediate neighbors
    - maybe adapt WFC to just have a is_valid_tile function that can be implemented differently depending on tile set - might not just be applicable to Sudoku? hmm. interesting.
- [done] instead of drawing a black tile in a non-filled-in cell - draw the possible candidate tiles




Good resources / sources of inspiration:
- https://www.youtube.com/watch?v=2SuvO4Gi7uY