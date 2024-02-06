import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// TODO: you should implement the required classes here or in another file.

export
const Part_one_hermite_base = defs.Part_one_hermite_base =
    class Part_one_hermite_base extends Component
    {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                               // This particular scene is broken up into two pieces for easier understanding.
                                               // The piece here is the base class, which sets up the machinery to draw a simple
                                               // scene demonstrating a few concepts.  A subclass of it, Part_one_hermite,
                                               // exposes only the display() method, which actually places and draws the shapes,
                                               // isolating that code so it can be experimented with on its own.
      init()
      {
        console.log("init")

        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
        // would be redundant to tell it again.  You should just re-use the
        // one called "box" more than once in display() to draw multiple cubes.
        // Don't define more than one blueprint for the same thing here.
        this.shapes = { 'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows()};

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;
        this.spline = new HermitSpline();


        

        // TODO: you should create a Spline class instance
      }

      render_animation( caller )
      {                                                // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Part_one_hermite, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if( !caller.controls )
        { this.animated_children.push( caller.controls = new defs.Movement_Controls( { uniforms: this.uniforms } ) );
          caller.controls.add_mouse_controls( caller.canvas );

          // Define the global camera and projection matrices, which are stored in shared_uniforms.  The camera
          // matrix follows the usual format for transforms, but with opposite values (cameras exist as
          // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
          // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() or
          // orthographic() automatically generate valid matrices for one.  The input arguments of
          // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.

          // !!! Camera changed here
          Shader.assign_camera( Mat4.look_at (vec3 (10, 10, 10), vec3 (0, 0, 0), vec3 (0, 1, 0)), this.uniforms );
        }
        this.uniforms.projection_transform = Mat4.perspective( Math.PI/4, caller.width/caller.height, 1, 100 );

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = this.uniforms.animation_time/1000;
        const angle = Math.sin( t );

        // const light_position = Mat4.rotation( angle,   1,0,0 ).times( vec4( 0,-1,1,0 ) ); !!!
        // !!! Light changed here
        const light_position = vec4(20 * Math.cos(angle), 20,  20 * Math.sin(angle), 1.0);
        this.uniforms.lights = [ defs.Phong_Shader.light_source( light_position, color( 1,1,1,1 ), 1000000 ) ];

        // draw axis arrows.
        this.shapes.axis.draw(caller, this.uniforms, Mat4.identity(), this.materials.rgb);
  
      }
    }


export class Part_one_hermite extends Part_one_hermite_base{ // **Part_one_hermite** is a Scene object that can be added to any display canvas.
                                                     // This particular scene is broken up into two pieces for easier understanding.
                                                     // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                     // The piece here exposes only the display() method, which actually places and draws
                                                     // the shapes.  We isolate that code so it can be experimented with on its own.
                                                     // This gives you a very small code sandbox for editing a simple scene, and for
                                                     // experimenting with matrix transformations.
                                                     // A hypothetical method to draw a line from 'start' to 'end'
                                                

  render_animation( caller )
  {                                                // display():  Called once per frame of animation.  For each shape that you want to
    // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
    // different matrix value to control where the shape appears.

    // Variables that are in scope for you to use:
    // this.shapes.box:   A vertex array object defining a 2x2x2 cube.
    // this.shapes.ball:  A vertex array object defining a 2x2x2 spherical surface.
    // this.materials.metal:    Selects a shader and draws with a shiny surface.
    // this.materials.plastic:  Selects a shader and draws a more matte surface.
    // this.lights:  A pre-made collection of Light objects.
    // this.hover:  A boolean variable that changes when the user presses a button.
    // shared_uniforms:  Information the shader needs for drawing.  Pass to draw().
    // caller:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().

    // Call the setup code that we left inside the base class:
    super.render_animation( caller );

    /**********************************
     Start coding down here!!!!
     **********************************/
        // From here on down it's just some example shapes drawn for you -- freely
        // replace them with your own!  Notice the usage of the Mat4 functions
        // translation(), scale(), and rotation() to generate matrices, and the
        // function times(), which generates products of matrices.

    const blue = color( 0,0,1,1 ), yellow = color( 1,0.7,0,1 );

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
        .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );


    // TODO: you should draw spline here.
    // Create the curve shape once during initialization

  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part One:";
    this.new_line();
    this.key_triggered_button( "Parse Commands", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Draw", [], this.update_scene );
    this.new_line();
    this.key_triggered_button( "Load", [], this.load_spline );
    this.new_line();
    this.key_triggered_button( "Export", [], this.export_spline );
    this.new_line();

    // Some code for your reference
    // this.key_triggered_button( "Copy input", [ "c" ], function() {
    //   let text = document.getElementById("input").value;
    //   console.log(text);
    //   document.getElementById("output").value = text;
    // } );
this.key_triggered_button("Calculate Arc Length", ["c"], function() {
  // Clear the spline data
  this.spline = new HermitSpline();
  let outputText = "";
  
  // Get the input text
  let text = document.getElementById("input").value;
  
  // Split the input text into lines
  const commands = text.split("\n");

  // Process each line
  commands.forEach((commandString) => {
    const parts = commandString.split(" ");
    const commandType = parts[0];

    // Parse the 'add point' command
    if (commandType === "add" && parts[1] === "point" && parts.length === 8) {
      // Extract point and tangent coordinates from the command
      const point = vec3(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
      const tangent = vec3(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));

      // Add point and tangent to the spline
      this.spline.addPoint(point, tangent);
    }
  });

  // Calculate the arc length of the spline
  const arcLength = this.spline.getArcLength();
  // Include the size of points and tangents in the output text
  // outputText += `Total number of points: ${this.spline.controlPoints.length}\n`;
  // outputText += `Total number of tangents: ${this.spline.tangents.length}`;


  // Display the arc length in the output
  document.getElementById("output").value = `Arc Length: ${arcLength}`;
  // document.getElementById("output").value = outputText;
});

    // this.new_line();
    // this.key_triggered_button( "Relocate", [ "r" ], function() {
    //   let text = document.getElementById("input").value;
    //   const words = text.split(' ');
    //   if (words.length >= 3) {
    //     const x = parseFloat(words[0]);
    //     const y = parseFloat(words[1]);
    //     const z = parseFloat(words[2]);
    //     this.ball_location = vec3(x, y, z)
    //     document.getElementById("output").value = "success";
    //   }
    //   else {
    //     document.getElementById("output").value = "invalid input";
    //   }
    // } );
    
  }
parse_commands() {
  let text = document.getElementById("input").value;
  const commands = text.split("\n"); // Split the input into lines
  let outputText = ""; // Initialize output text

  commands.forEach((commandString, index) => {
    // Trim any leading/trailing whitespace from the commandString
    commandString = commandString.trim();
    const parts = commandString.split(/\s+/); // Split on one or more spaces
    const commandType = parts[0];

    // Check if there are exactly 8 parts following the command type "add point"
    if (commandType === "add" && parts[1] === "point" && parts.length === 8) {
      // Extract point and tangent coordinates from the command
      const point = vec3(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
      const tangent = vec3(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
      // Add point and tangent to the spline
      this.spline.addPoint(point, tangent);

      // Append the point and tangent to the output text
      // outputText += `Point ${index}: (${point[0]}, ${point[1]}, ${point[2]}), `;
      // outputText += `Tangent ${index}: (${tangent[0]}, ${tangent[1]}, ${tangent[2]})\n`;
    } else {
      // If the command is not recognized, log it for debugging
      console.log(`Unrecognized command: ${commandString}`);
    }
  });
  // Include the size of points and tangents in the output text
  outputText += `Total number of points: ${this.spline.controlPoints.length}\n`;
  outputText += `Total number of tangents: ${this.spline.tangents.length}`;

  // document.getElementById("output").value = outputText;

  document.getElementById("output").value = "Parsed commends";
  // Set the output text or a "not parsed" message if outputText is empty
  // document.getElementById("output").value = outputText || "No valid commands parsed.";
}


  update_scene() { // callback for Draw button
    document.getElementById("output").value = "update_scene";
    //TODO
  }

  load_spline() {
    document.getElementById("output").value = "load_spline";
    //TODO
  }

  export_spline() {
    document.getElementById("output").value = "export_spline";
    //TODO
  }
}

export class HermitSpline{
  constructor() {
      this.controlPoints = []; // Array of vec3 for control points
      this.tangents = []; // Array of vec3 for tangents
      this.size = 0;
    }

    // Add a point with its tangent
    addPoint(position, tangent) {
      if (this.controlPoints.length < 40) {
        this.controlPoints.push(position);
        this.tangents.push(tangent);
        this.size++;
      } else {
        console.error("Maximum number of control points (40) reached.");
      }
    }

    // Set a control point at a specific index
    setPoint(index, position) {
      if (index < this.controlPoints.length) {
        this.controlPoints[index] = position;
      } else {
        console.error("Invalid control point index.");
      }
    }

    // Set a tangent for a specific control point
    setTangent(index, tangent) {
      if (index < this.controlPoints.length) {
        this.tangents[index] = tangent;
      } else {
        console.error("Invalid control point index.");
      }
    }

    getPosition(t) {
    const A = Math.floor(t * (this.controlPoints.length - 1));
    const B = Math.ceil(t * (this.controlPoints.length - 1));
    const s = (t * (this.controlPoints.length - 1)) % 1.0;

    const p0 = this.controlPoints[A];
    const m0 = this.tangents[A];
    const p1 = this.controlPoints[B];
    const m1 = this.tangents[B];

    // Hermite basis functions
    const h0 = (2 * s * s * s) - (3 * s * s) + 1;
    const h1 = (s * s * s) - (2 * s * s) + s;
    const h2 = (-2 * s * s * s) + (3 * s * s);
    const h3 = (s * s * s) - (s * s);

    // Compute the interpolated position
    const position = p0.times(h0).plus(m0.times(h1)).plus(p1.times(h2)).plus(m1.times(h3));
    return position;
  }


    // More functions related to arc length, drawing, etc., will be added here
    // Function to approximate the arc length of the spline
    getArcLength() {
      let arcLength = 0;
      let numSamples = 1000; // More samples will give a more accurate result
      let previousPoint = this.getPosition(0);

      for (let i = 1; i < numSamples + 1; i++) {
        let t = i / numSamples;
        let currentPoint = this.getPosition(t);
        arcLength += currentPoint.minus(previousPoint).norm(); // Calculate the distance between points
        previousPoint = currentPoint;
      }

      return arcLength;
    }

}

class Curve_Shape extends Shape {
  constructor(curve_function, sample_count, curve_color = color(1, 0, 0, 1)) {
    super("position", "normal");
    this.material = { shader: new defs.Phong_Shader(), ambient: 1.0, color: curve_color };
    this.sample_count = sample_count;
    
    // Initialize arrays if not already initialized by the parent class
    this.arrays.position = this.arrays.position || [];
    this.arrays.normal = this.arrays.normal || [];

    if (curve_function && this.sample_count) {
      for (let i = 0; i < this.sample_count + 1; i++) {
        let t = i / this.sample_count;
        this.arrays.position.push(curve_function(t)); // Use 'arrays', not 'array'
        this.arrays.normal.push(vec3(0, 0, 0)); // Use 'arrays', not 'array'
      }
    }
  }

  draw(webgl_manager, uniforms) {
    super.draw(webgl_manager, uniforms, Mat4.identity(), this.material, "LINE_STRIP");
  }
}


