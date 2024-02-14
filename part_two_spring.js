import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;


export
const Part_two_spring_base = defs.Part_two_spring_base =
    class Part_two_spring_base extends Component
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
          'axis' : new defs.Axis_Arrows() };

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

        // TODO: you should create the necessary shapes
        this.particle = new ParticleSystem();
        this.springShapes = []; // Use this array to store spring shapes
        for(let i = 0; i < 10; i++){
          this.springShapes.push(new Spring_Shape(vec3(0, 0, 0), vec3(0, 0, 0), color(1, 0, 0, 1)));
        }
        // this.springShape = new Spring_Shape(vec3(0, 0, 0), vec3(0, 0, 0), color(1, 0, 0, 1));
        
        // this.par_shape = new particle_Shape(0.25,this.particle.particles.length, color( .9,.5,.9,1 ));
        // this.Spring_Shape = new Spring_Shape()
        // this.ball_particle = new Ball(vec3(0,0,0), 0.25,color(1, 0, 0, 1));
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


export class Part_two_spring extends Part_two_spring_base
{                                                    // **Part_one_hermite** is a Scene object that can be added to any display canvas.
                                                     // This particular scene is broken up into two pieces for easier understanding.
                                                     // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                     // The piece here exposes only the display() method, which actually places and draws
                                                     // the shapes.  We isolate that code so it can be experimented with on its own.
                                                     // This gives you a very small code sandbox for editing a simple scene, and for
                                                     // experimenting with matrix transformations.
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

    const blue = color( 0,0,1,1 ), yellow = color( 1,1,0,1 );

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );
    // !!! Draw ball (for reference)
    // let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
    //     .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));

    // this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );
    // // Assuming a render or draw method that gets called every frame
    // for(let s = 0; s < 1000/60; s++){
      // this.particle.update(s);
      const timestep = 1/1000;
      const totalSimulationTime = 1000; // total simulation time in "seconds" or units of time
      const steps = 50; // 

      for (let i = 0; i < this.particle.particles.length; i++) {
        const p = this.particle.particles[i];
        // Assuming each particle has a position property
        let ball_transform = Mat4.translation(p.position[0], p.position[1], p.position[2])
            .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
        // Ensure 'blue' is defined correctly as a color
        const blueColor = color(0, 0, 1, 1); // Example: Define blue using your color function
        this.shapes.ball.draw(caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blueColor });
        // console.log(i + "Force: " + p.force);

      }

      for(let j = 0; j < this.particle.springs.length; j++){
        const spring = this.particle.springs[j];
        // console.log(spring);
        let p1 = spring.particle1.position;
        let p2 = spring.particle2.position;
        console.log(p1);
        console.log(p2);
        this.springShapes[j].updateVertices(p1, p2);
        this.springShapes[j].draw(caller, this.uniforms);
      }

    //  Assuming a fixed timestep for simplicity, e.g., 1/60th of a second for 60 FPS simulation
    // Calculate the number of steps needed

    for (let t = 0; t < steps; t++) {
        this.particle.update(timestep);
        t = t+timestep;
        
        // Optionally, log the position of one or more particles at certain intervals
        // if (t % 60 === 0) { // For example, log every 1 second of simulation time
        //     this.particle.particles.forEach((p, index) => {
        //         console.log(`Particle ${index} position at time ${t * timestep}:`, p.position);
        //     });
        // }
    }

    
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Two:";
    this.new_line();
    this.key_triggered_button( "Config", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Run", [], this.start );
    this.new_line();

    //  Some code for your reference
    this.key_triggered_button( "Copy input", [ "c" ], function() {
      let text = document.getElementById("input").value;
      console.log(text);
      document.getElementById("output").value = text;
    } );
    this.new_line();
    this.key_triggered_button( "Relocate", [ "r" ], function() {
      let text = document.getElementById("input").value;
      const words = text.split(' ');
      if (words.length >= 3) {
        const x = parseFloat(words[0]);
        const y = parseFloat(words[1]);
        const z = parseFloat(words[2]);
        this.ball_location = vec3(x, y, z)
        document.getElementById("output").value = "success";
      }
      else {
        document.getElementById("output").value = "invalid input";
      }
    } );
  
  }

  // parse_commands() {
  //   let inputText = document.getElementById("input").value;
  //   let outputText = "";
  //   const commands = inputText.split("\n");
  //   for (const command of commands) {
  //     const parts = command.split(" ");
  //     if (parts[0] === "create" && parts[1] === "particles") {
  //       const numParticles = parseInt(parts[2]);
  //       if (!isNaN(numParticles)) {
  //         this.particle.createParticles(numParticles);
  //         outputText += `Created ${numParticles} particles\n`;
  //       } else {
  //         outputText += `Invalid number of particles: ${parts[2]}\n`;
  //       }
  //     }
  //     // Add more command parsing as necessary
  //   }
  //   document.getElementById("output").value = outputText;
  // }

  parse_commands() {
  let inputText = document.getElementById("input").value;
  let outputText = "";
  const commands = inputText.split("\n");

  for (const command of commands) {
    const parts = command.split(" ");
    const commandType = parts[0];

    switch (commandType) {
      case "create":
        if (parts[0] === "create" && parts[1] === "particles") {
        const numParticles = parseInt(parts[2]);
        if (!isNaN(numParticles)) {
          this.particle.createParticles(numParticles);

          outputText += `Created ${numParticles} particles\n`;
        } else {
          outputText += `Invalid number of particles: ${parts[2]}\n`;
        }
      }else if(parts[0] === "create" && parts[1] === "springs"){
        const numSprings = parseInt(parts[2]);
        this.particle.createSprings(numSprings);
        outputText += `Created ${numSprings} springs\n`;
      }
        break;

      case "particle":
        if (parts.length === 9) { // Ensure there are enough parts for the command
          const index = parseInt(parts[1]);
          const mass = parseFloat(parts[2]);
          const posX = parseFloat(parts[3]);
          const posY = parseFloat(parts[4]);
          const posZ = parseFloat(parts[5]);
          const velX = parseFloat(parts[6]);
          const velY = parseFloat(parts[7]);
          const velZ = parseFloat(parts[8]);
          
          if (this.particle.particles[index] !== undefined) {
            const position = vec3(posX, posY, posZ);
            const velocity = vec3(velX, velY, velZ);
            this.particle.particles[index].setProperties(mass, position, velocity);
            const x = parseFloat(this.particle.particles[index].position[0]);
            const y = parseFloat(this.particle.particles[index].position[1]);
            const z = parseFloat(this.particle.particles[index].position[2]);
            this.ball_location = vec3(x, y, z)
            outputText += `Particle ${index}: ${velocity}\n`;
          } else {
            outputText += `Particle ${index} does not exist\n`;
          }
        } else {
          outputText += `Invalid particle command format\n`;
        }

        break;

      case "all_velocities":
        if (parts.length === 4) { // Check if the command has the correct number of arguments
          const velX = parseFloat(parts[1]);
          const velY = parseFloat(parts[2]);
          const velZ = parseFloat(parts[3]);

          if (!isNaN(velX) && !isNaN(velY) && !isNaN(velZ)) {
            const newVelocity = vec3(velX, velY, velZ);
            this.particle.particles.forEach(parti => {
              parti.velocity = newVelocity;
            });
            outputText += `All velocities set to (${velX}, ${velY}, ${velZ})\n`;
          } else {
            outputText += `Invalid velocity values: ${parts[1]} ${parts[2]} ${parts[3]}\n`;
          }
        } else {
          outputText += `Invalid all_velocities command format\n`;
        }
        break;

      case "link":
        const sindex = parseInt(parts[1]);
        const pindex1 = parseInt(parts[2]);
        const pindex2 = parseInt(parts[3]);
        const ks = parseFloat(parts[4]);
        const kd = parseFloat(parts[5]);
        const length = parseFloat(parts[6]);
        this.particle.link(sindex, pindex1, pindex2, ks, kd, length);
        outputText += `Linked ${pindex1} particle and ${pindex2} with ${sindex} spring and ${ks}  ${kd} `;
        break;

        // Handle other commands as necessary
      default:
        outputText += `Unrecognized command: ${command}\n`;
        break;

      case "ground":
        const elasity = parseInt (parts[1]);
        const viscosity = parseInt (parts[2]);
        this.particle.ground(elasity, viscosity);
        outputText += `particles elasity: ${parts[1]}\nparticles visicosity: ${parts[2]}`;
        break;

      case "gravity":
        const g  = parseFloat(parts[1]);
        const G = g * (-1);
        const gforce = vec3(0, G, 0);
        this.particle.particles.forEach(parti => {
              parti.acceleration = parti.setAcceleration(gforce);
          });
        outputText += `particles acce : ${gforce}`
    }

  }

  document.getElementById("output").value = outputText;
}


  start() { 
    // callback for Run button
    // Clear previous output or drawings if necessary
    // For WebGL, you might clear the canvas or reset transformations
    // Generate a transformation matrix for the particle
    // This assumes you have a method to convert a particle's position to a transformation matrix
    // The specifics of this would depend on your rendering context and how you handle transformations
    // Draw the ball using the generated transformation
    // Assuming 'caller' and 'this.uniforms' are correctly set up context for your drawing function
  
  }
}

export 
class Particle {
  constructor(mass = 1, position = vec3(0, 0, 0), velocity = vec3(0, 0, 0)) {
    this.mass = mass;
    this.position = position;
    this.velocity = velocity;
    this.force = vec3(0, 0, 0); // Initialize total force acting on particle
    this.acceleration = vec3(0, 0, 0);
  }

  // Method to update the particle's properties
  setProperties(mass, position, velocity) {
    this.mass = mass;
    this.position = position;
    this.velocity = velocity;
  }

  setAcceleration(g){
    this.acceleration = g.times(1/this.mass);
  }

  applyForce(force) {
    // console.log(`Before applying force: ${this.force}`);
    this.force = this.force.plus(force);
    this.acceleration = this.force.times(1/this.mass);
  }

  integrate(timestep) {
    this.velocity = this.velocity.plus(this.acceleration.times(timestep));
    this.position = this.position.plus(this.velocity.times(timestep));
    this.force.set(0, 0, 0); 
  }
}

export
class Spring {
  constructor(particle1, particle2, ks, kd, restLength) {
    this.particle1 = particle1;
    this.particle2 = particle2;
    this.ks = ks; // Spring constant
    this.kd = kd; // Damping constant
    this.restLength = restLength < 0 ? particle2.position.minus(particle1.position) : restLength;
  }

  applySpringForce() {
    let distanceVec = this.particle2.position.minus(this.particle1.position);
    console.log(this.particle1.position)
    console.log(this.particle2.position)
    // console.log(distanceVec);
    let distance = distanceVec.norm(); // Ensure this is correctly calling the magnitude method
    // console.log(distance);
    let forceDirection = distanceVec.normalized();
    // console.log(forceDirection);
    let stretch = distance - this.restLength;
    let forceMagnitude = this.ks*stretch;
    let forceVector = forceDirection.times(forceMagnitude);
    let velocityDifference = this.particle2.velocity.minus(this.particle1.velocity);
    // console.log(forceVector);
    // console.log(velocityDifference);
    let dampingForce = velocityDifference.dot(forceDirection) * this.kd;
    let dampingVector = forceDirection.times(dampingForce);
    // console.log(dampingVector);
    let totalForce = forceVector.plus(dampingVector.times(-1));
    // console.log(totalForce)
    this.particle1.applyForce(totalForce);
    this.particle2.applyForce(totalForce.times(-1));
    // console.log(this.particle1.force);
    // console.log(this.particle2.force);
  }
}

// outer loop : dt
// inner loop: t-step 

export 
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.springs = [];
    this.elasitiy = 0;
    this.viscosity = 0;
    this.gravity = vec3(0, -9.81, 0);
    // You will need to add properties for ground parameters, integration method, etc.
  }

  createParticles(number) {
    this.particles = []; // Reset the particle system
    for (let i = 0; i < number; i++) {
      // Initialize particles at the origin or as per specific requirements
      this.particles.push(new Particle());
    }
  }

  // Method to add placeholders for a specified number of springs
  createSprings(number) {
    for (let i = 0; i < number; i++) {
      this.springs.push(null); // Add null or a placeholder spring object
    }
  }

  ground(ks, kd){
    this.elasitiy = ks;
    this.viscosity = kd;
  }

  link(sindex, pindex1, pindex2, ks, kd, length) {
    // Validate indices
    if (pindex1 < 0 || pindex1 >= this.particles.length || pindex2 < 0 || pindex2 >= this.particles.length) {
      console.error("Invalid particle index: ", pindex1, pindex2);
      return;
    }
    // Retrieve particles
    let particle1 = this.particles[pindex1];
    let particle2 = this.particles[pindex2];

    // Determine the rest length
    const restLength = length < 0 ? particle1.position.minus(particle2.position) : length;

    // Create a new spring with the specified properties
    const newSpring = new Spring(particle1, particle2, ks, kd, restLength);

    // Check if sindex is within bounds and replace or add the spring accordingly
    if (sindex >= 0 && sindex < this.springs.length) {
      this.springs[sindex] = newSpring;
    } else if (sindex === this.springs.length) {
      // Adding a new spring at the end
      this.springs.push(newSpring);
    } else {
      console.error("Invalid spring index: " + sindex);
    }
}

  addSpring(particle1, particle2, ks, kd, restLength) {
    // If the restLength is negative, calculate the current distance as the rest length
    if (restLength < 0) {
      restLength = particle1.position.minus(particle2.position);
    }
    // Create a new spring instance
    const newSpring = new Spring(particle1, particle2, ks, kd, restLength);
    // Add the new spring to the array of springs
    this.springs.push(newSpring);
  }

  /// Method to update the system state using Forward Euler integration
  update(timestep) {
    // Apply gravity to all particles
    for (let particle of this.particles) {
      // let gravityForce = vec3(this.gravity.x * particle.mass, this.gravity.y * particle.mass, this.gravity.z * particle.mass);
      let gravityForce = this.gravity.times(particle.mass)
      particle.applyForce(gravityForce);
      console.log(particle.force);
      // particle.applyForce(this.gravity.multiplyScalar(particle.mass));
    }

    // Integrate velocities and positions
    for (let particle of this.particles) {
      particle.integrate(timestep);
      // this.resolveCollisionWithGround(particle);
    }

    // Apply spring forces
    // for (let spring of this.springs) {
    //   // console.log(spring);
    //   console.log(spring.particle1)
    //   console.log(spring.particle2)
    //   // spring.particle1.integrate(timestep);
    //   // spring.particle2.integrate(timestep);
    //   spring.applySpringForce()
    // }
    this.springs.forEach(spring => {
      spring.applySpringForce();
    });
  }

  resolveCollisionWithGround(particle) {
    // Assuming ground plane is y = 0 with normal n = [0, 1, 0]
    const groundPoint = vec3(0, 0, 0); // P
    const groundNormal = vec3(0, 1, 0); // n

    // Calculate signed distance from particle to ground plane
    let distance = particle.position.minus(groundPoint).dot(groundNormal);
    
    // Check for collision (particle is below ground)
    if (distance < 0) {
      // Resolve position (place particle on the ground)
      particle.position = particle.position.plus(groundNormal.times(-distance));

      // Reflect velocity about the ground plane and apply restitution
      let restitution = 1 - this.elasticity; // Convert elasticity to restitution
      let velocityNormalComponent = groundNormal.times(particle.velocity.dot(groundNormal));
      let velocityTangentComponent = particle.velocity.minus(velocityNormalComponent);
      particle.velocity = velocityTangentComponent.minus(velocityNormalComponent.times(restitution));
      
      // Apply friction based on viscosity if needed
      particle.velocity = particle.velocity.minus(velocityTangentComponent.times(this.viscosity));
    }
  }

  symplecticEuler(timestep) { /* ... */ }
  verlet(timestep) { /* ... */ }
}

class Spring_Shape extends Shape {
  constructor(p1, p2, line_color = color(1, 0, 0, 1)) {
    super("position", "normal");
    this.material = {
      shader: new defs.Phong_Shader(),
      ambient: 1.0,
      color: line_color
    };
    this.p1 = p1;
    this.p2 = p2;

    // // Convert vec3 to arrays if necessary
    // this.updateVertices(p1, p2);
  }

  updateVertices(p1, p2) {
  // this.position = this.position.plus(this.velocity.times(timestep));
  this.p1 = p1;
  this.p2 = p2;

  this.arrays.position = [ 
    [p1[0], p1[1], p1[2]], // Convert the first point
    [p2[0], p2[1], p2[2]]  // Convert the second point
  ];
  this.arrays.normal = [
    [0, 0, 1], // Normal for the first vertex
    [0, 0, 1]  // Normal for the second vertex
  ];
  // console.log(this.arrays.position);
}

  draw(webgl_manager, uniforms) {
    // Ensure the draw mode is supported and correctly implemented in your Shape's base class
    super.draw(webgl_manager, uniforms, Mat4.identity(), this.material, "LINES");
  }
}

