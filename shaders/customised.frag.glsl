/**
 *  edited by Rhuan from the minisphere Galileo
 *  default fragment shader - see comment below for orriginal attribution
 *  
 *  edits add:
 *  1. facility to use a texture like an atlas through specifying a tex_move vector uniform
 *  2. facility to apply colour masks through specying a mask_mode integer uniform and an m_c colour uniform
 *
 *  minisphere Galileo default fragment shader
 *  provides the basic guarantees required by the Galileo specification
 *  (c) 2015-2016 Fat Cerberus
**/

#ifdef GL_ES
precision mediump float;
#endif

// texturing parameters courtesy of Allegro
uniform sampler2D al_tex;
uniform bool al_use_tex;

//masking
uniform int mask_mode;
uniform vec4 m_c;

vec4 basic_colour;
vec4 masked_colour;

// input from vertex shader
varying vec4 varying_colour;
varying vec2 varying_texcoord;

void main()
{
  basic_colour = al_use_tex ? varying_colour * texture2D(al_tex, varying_texcoord) : varying_colour;
  
  if(mask_mode < 2)
  {
    masked_colour = basic_colour;
  }
  else if((mask_mode==2 && (basic_colour != vec4(0,0,0,basic_colour[3]))) || mask_mode == 4)//add
  {
    masked_colour = min(basic_colour + m_c, vec4(1,1,1,1));
  }
  else if(mask_mode==3)//subtract
  {
    masked_colour = max(basic_colour - m_c, vec4(0,0,0,0));
  }
  else
  {
    masked_colour = basic_colour;
  }
  
  gl_FragColor = masked_colour;
}
