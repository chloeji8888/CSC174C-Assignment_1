import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// TODO: you should implement the required classes here or in another file.

export
const Part_three_chain_base = defs.Part_three_chain_base =
    class Part_three_chain_base extends Component
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

        this.ball_location = vec3(0.0, 5.0, 5.0);
        this.ball_radius = 0.25;

        this.spline = new HermitSpline();
        this.spline.controlPoints = [];
        this.spline.tangents = [];
        this.spline.addPoint(vec3(0.0, 8.0, 0.0), vec3(-5.0, 0.0, 5.0));
        this.spline.addPoint(vec3(0.0, 8.0, 5.0), vec3(5.0, 0.0, 5.0));
        this.spline.addPoint(vec3(5.0, 8.0, 5.0), vec3(5.0, 0.0, -5.0));
        this.spline.addPoint(vec3(5.0, 8.0, 0.0), vec3(-5.0, 0.0, -5.0));
        this.spline.addPoint(vec3(0.0, 8.0, 0.0), vec3(-5.0, 0.0, 5.0));
        

        const curves = (t)=> this.spline.getPosition(t)
        this.curve = new Curve_Shape(curves, 1000, color(1, 0, 0, 1));

        const numParticles = 8; // For example, create a chain of 10 particles
        const particleDistance = 1; // Distance between each particle
        const ks = 5; // Spring constant for Hooke's law
        const kd = 1; // Damping constant for the springs

        // Initialize particle system
        this.particle = new ParticleSystem();

        // Create particles in a line
        for (let i = 0; i < numParticles; i++) {
            const position = vec3(0.0, (8.0-i) * particleDistance, 5.0); // Start from (0.0, 5.0, 0.0) and place them along the x-axis
            const particle = new Particle(0.1, position); // Assuming mass of 1 for all particles
            this.particle.particles.push(particle);
            console.log(this.particle.particles);
        }
        // Link particles with springs
        for (let i = 0; i < numParticles - 1; i++) {
            const spring = new Spring(this.particle.particles[i], this.particle.particles[i + 1], ks, kd, particleDistance);
            this.particle.springs.push(spring);
        }
    // TODO: you should create the necessary shapes
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
                // Calculate the time step based on the frame rate
        const frameRate = 60; // Target frame rate
        let dt = 1.0 / frameRate; // Time step for display updates

        // Clamp dt to a maximum value to prevent instability (1/30 is suggested in your feedback)
        dt = Math.min(1.0 / 30, dt);

        
        // Calculate the next simulation time
        const t_next = this.t_sim + dt;
        

        // Use a smaller time step for the simulation updates to maintain stability
        const t_step = 1 / 1000; // A smaller time step for the simulation (e.g., 1 millisecond)

        // Update the simulation in steps until reaching the next display time
        for (; this.t_sim <= t_next; this.t_sim += t_step) {
          this.particle.update(t_step, this.spline);
        }
        
      }
    }


export class Part_three_chain extends Part_three_chain_base
{                                                    // **Part_one_hermite** is a Scene object that can be added to any display canvas.
                                                     // This particular scene is broken up into two pieces for easier understanding.
                                                     // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                     // The piece here exposes only the display() method, which actually places and draws
                                                     // the shapes.  We isolate that code so it can be experimented with on its own.
                                                     // This gives you a very small code sandbox for editing a simple scene, and for
                                                  // experimenting with matrix transformations.
  constructor(){
  super();
  this.t_sim = 0; 
}
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

    
    this.curve.draw(caller, this.uniforms);
    this.particle.draw(caller, this.uniforms, this.shapes, this.materials);
    
        
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Three: (no buttons)";
    this.new_line();
    
  }

  parse_commands() {
    document.getElementById("output").value = "parse_commands";
  }

  start() { // callback for Run button
    document.getElementById("output").value = "start";
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

    if (this.controlPoints.length === 0) {
        return vec3(0, 0, 0);
    }
    const A = Math.floor(t * (this.controlPoints.length - 1));
    const B = Math.ceil(t * (this.controlPoints.length - 1));
    const s = (t * (this.controlPoints.length - 1)) % 1.0;

    let p0 = this.controlPoints[A].copy();
    let m0 = this.tangents[A].copy().times(1.0 / (this.controlPoints.length-1));
    let p1 = this.controlPoints[B].copy();
    let m1 = this.tangents[B].copy().times(1.0 / (this.controlPoints.length-1));

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
    // print the table of arclength - for each step 

}
export 
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.springs = [];
    this.elasitiy = 0;
    this.viscosity = 0;
    this.gravity = vec3(0, -9.81, 0);
    this.method = 0;
    this.time = 0;
    this.splineTime = 0;  // Parameter to traverse the spline
    this.splineSpeed = 0.1;
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

  setTimeout(t){
    this.time = t;
  }

  ground(el, vis){
    this.elasitiy = el;
    this.viscosity = vis;
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
    const restLength = length < 0 ? particle1.position.minus(particle2.position).norm() : length;

    // Create a new spring with the specified properties
    const newSpring = new Spring(particle1, particle2, ks, kd, restLength);
    
    // Check if sindex is within bounds and replace or add the spring accordingly
    if (sindex >= 0 && sindex < this.springs.length) {
      // console.log("get in");
      this.springs[sindex] = newSpring;
      console.log(this.springs[0]);
    } else if (sindex === this.springs.length) {
      // Adding a new spring at the end
      this.springs.push(newSpring);
    } else {
      console.error("Invalid spring index: " + sindex);
    }
}
  /// Method to update the system state using Forward Euler integration
  update(times_pairwise, spline) {
    const mu_k = 0.9;
    // First, update the position of the head particle to follow the spline.
    if (this.particles.length > 0) {
        // Increment the spline parameter over time to move along the spline
        this.splineTime = this.splineTime + this.splineSpeed * times_pairwise;
        // Ensure the splineTime stays within a valid range, e.g., [0, 1] or loop back
        this.splineTime %= 1; // Example of looping back for continuous movement
        // console.log(this.splineTime)
        // Calculate the new position of the first particle along the spline
        const newPosition = spline.getPosition(this.splineTime);
        this.particles[0].position = newPosition;
    }

    // Example friction coefficients
    // Apply gravity to all particles except the first one, which follows the spline
    for (let i = 1; i < this.particles.length; i++) {
        let particle = this.particles[i];
        particle.force = vec3(0,0,0);
        particle.applyForce(this.gravity.times(particle.mass));
    }

    // Apply spring forces between connected particles
    this.springs.forEach(spring => {
        spring.applySpringForce();
    });

    // Update particles based on forces, excluding the first particle
    for (let i = 1; i < this.particles.length; i++) {
        let particle = this.particles[i];
        particle.resolveCollisionWithGround(this.elasitiy, this.viscosity, mu_k);
        if (this.method == 0) {
            particle.integrate_Euler(times_pairwise);
        } else if (this.method == 1) {
            particle.integrate_Sy(times_pairwise);
        } else {
            particle.integrate_VelocityVerlet(times_pairwise);
        }
    }
}

  draw(webgl_manager, uniforms, shapes, materials){
    // console.log('drwaw')
    const red = color(1, 0, 0, 1);
    let ball_radius = 0.25;
    console.log(this.particles);
    for(const p of this.particles){
      // const p = this.particle.particles[i];
        // Assuming each particle has a position property
        // console.log(p)
        let ball_transform = Mat4.translation(p.position[0], p.position[1], p.position[2])
            .times(Mat4.scale(ball_radius, ball_radius, ball_radius));
        // Ensure 'blue' is defined correctly as a color
        const blueColor = color(0, 0, 1, 1); // Example: Define blue using your color function
        shapes.ball.draw(webgl_manager, uniforms, ball_transform, { ...materials.metal, color: blueColor });
        
    }
   for (const s of this.springs) {
      const p1 = s.particle1.position;
      const p2 = s.particle2.position;
      const springVector = p2.minus(p1);
      const len = springVector.norm();
      const center = p1.plus(p2).times(0.5);

      // Handle the special case when the spring is vertical.
      if (Math.abs(springVector[0]) < 1e-6 && Math.abs(springVector[2]) < 1e-6) {
        // Vertical spring: We can construct the model transformation without rotation.
        let model_trans = Mat4.translation(center[0], center[1], center[2])
                          .times(Mat4.scale(0.05, len / 2, 0.05));

        shapes.box.draw(webgl_manager, uniforms, model_trans, { ...materials.plastic, color: red });
      } else {
        // Non-vertical spring: We can proceed with the cross product and rotation.
        const p = springVector.normalized();
        const v = vec3(0,1,0); // Up vector
        const axis = v.cross(p).normalized();
        const angle = Math.acos(v.dot(p));

        let model_trans = Mat4.translation(center[0], center[1], center[2])
                          .times(Mat4.rotation(angle, axis[0], axis[1], axis[2]))
                          .times(Mat4.scale(0.05, len / 2, 0.05));

        shapes.box.draw(webgl_manager, uniforms, model_trans, { ...materials.plastic, color: red });
      }
  }

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
    // console.log(this.acceleration);
    this.acceleration = g.times(1/this.mass);
  }

  applyForce(force) {
    // console.log(`Before applying force: ${this.force}`);
    this.force = this.force.plus(force);
    this.acceleration = this.force.times(1/this.mass);
    console.log()
  }
  
  resolveCollisionWithGround(elasticity, viscosity, mu_s, mu_k) {
  const groundPoint = vec3(0, 0, 0); // Ground position P_g
  const groundNormal = vec3(0, 1, 0); // Ground normal n̂
  const restitution = 0.8; // Coefficient of restitution
  let distance = this.position.minus(groundPoint).dot(groundNormal); // Distance from the ground
  let relativeVelocity = this.velocity.dot(groundNormal); // Velocity towards the ground
  let tangentialVelocity = this.velocity.minus(groundNormal.times(relativeVelocity));

  // Calculate the spring force using Hooke's Law
  let springForce = groundNormal.times(elasticity * Math.max(distance, 0));
  // Calculate the damping force
  let dampingForce = groundNormal.times(viscosity * relativeVelocity);

  // Calculate the normal force (spring + damping)
  let normalForce = groundNormal.times(this.force.dot(groundNormal)).times(-1);

  // Update the force with spring and damping forces
  this.force = this.force.plus(springForce.minus(dampingForce));

  // Apply friction if the object is touching the ground
  if (distance < 0) {
    this.position = this.position.plus(groundNormal.times(-distance));
    this.velocity = this.velocity.minus(groundNormal.times(relativeVelocity * (1 + restitution)));

    // Check if the tangential force exceeds the static friction
if (tangentialVelocity.norm() > 0) {
  let tangentialForceMagnitude = this.force.minus(normalForce).norm();
  let normalForceMagnitude = normalForce.norm();

  // If the tangential force is less than static friction threshold, apply a scaled-down force
  if (tangentialForceMagnitude < mu_s * normalForceMagnitude) {
    // Apply a slowdown factor to the velocity
    let slowdownFactor = tangentialForceMagnitude / (mu_s * normalForceMagnitude);
    this.velocity = this.velocity.times(slowdownFactor);
    // Scale down the acceleration as well
    this.acceleration = this.acceleration.times(slowdownFactor);
  } else {
    // Otherwise, apply kinetic friction
    let frictionDirection = tangentialVelocity.normalized().times(-1);
    let frictionForceMagnitude = mu_k * normalForceMagnitude;
    let frictionForce = frictionDirection.times(frictionForceMagnitude);
    this.force = this.force.plus(frictionForce);
    // Adjust the velocity for kinetic friction
    // this.velocity = this.velocity.plus(frictionForce.times(1/this.mass).times(timestep));
  }
}
}
  }


  integrate_Sy(timestep) {// Symlectiv Euler
    this.velocity = this.velocity.plus(this.acceleration.times(timestep));
    this.position = this.position.plus(this.velocity.times(timestep));
    // this.resolveCollisionWithGround();
    this.acceleration = vec3(0,0,0);
    // this.velocity = vec3(0,0,0);
    this.force = vec3(0, 0, 0); 
  }

  integrate_Euler(timestep){
    this.position = this.position.plus(this.velocity.times(timestep));
    // Then update the velocity using the current acceleration
    this.velocity = this.velocity.plus(this.acceleration.times(timestep));
    // Reset acceleration and force for the next step
    this.acceleration = vec3(0, 0, 0);
    this.force = vec3(0, 0, 0);
  }
  
  integrate_VelocityVerlet(timestep) {
    // Update position with current velocity and half the timestep's acceleration
    this.position = this.position.plus(this.velocity.times(timestep))
                                  .plus(this.acceleration.times(0.5 * timestep * timestep));

    // Store the current acceleration to use for the velocity update
    const currentAcceleration = this.acceleration.copy();

    // Typically, you would calculate the new force and thus the new acceleration here,
    // since it may depend on the new position. For example:
    // this.force = calculateForce(this.position, this.velocity, ...);
    // this.acceleration = this.force.times(1 / this.mass);

    // Then update velocity with the average of the current and new accelerations
    this.velocity = this.velocity.plus(currentAcceleration.plus(this.acceleration).times(0.5 * timestep));
}
}

export
class Spring {
  constructor(particle1, particle2, ks, kd, restLength) {
    this.particle1 = particle1;
    this.particle2 = particle2;
    this.ks = ks; // Spring constant
    this.kd = kd; // Damping constant
    this.restLength = restLength;
  }

  applySpringForce() {
    let distanceVec = this.particle2.position.minus(this.particle1.position);
    let distance = distanceVec.norm(); // Ensure this is correctly calling the magnitude method
    // console.log(distance);
    let forceDirection = distanceVec.normalized();
    let stretch = distance - this.restLength;
    // console.log(this.ks);
    let forceMagnitude = this.ks * stretch;
    let forceVector = forceDirection.times(forceMagnitude);
    // console.log(forceVector);
    let velocityDifference = this.particle2.velocity.minus(this.particle1.velocity);
    // console.log(forceVector);
    let dampingForce = velocityDifference.dot(forceDirection)*this.kd;
    let dampingVector = forceDirection.times(dampingForce);
    // console.log(dampingVector);
    let totalForce = forceVector.plus(dampingVector);
    // console.log("total", totalForce)
    // console.log(this.particle1.force);
    // console.log(this.particle2.force);
    this.particle1.applyForce(totalForce);
    this.particle2.applyForce(totalForce.times(-1));
    // console.log(this.particle1.force, this.particle2.force);
    
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



