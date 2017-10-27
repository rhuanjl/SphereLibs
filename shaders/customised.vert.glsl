/**
 *  edited by Rhuan from the minisphere Galileo
 *  default vertex shader - see comment below for orriginal attribution
 *  
 *  edits add:
 *  1. facility to use a texture like an atlas through specifying a tex_move vector uniform
 *  2. facility to apply colour masks through specying a mask_mode integer uniform and an m_c colour uniform
 *
 *   minisphere Galileo default vertex shader
 *  provides the basic guarantees required by the Galileo specification
 *  (c) 2015-2016 Fat Cerberus
**/

// texture and transformation parameters courtesy of Allegro
attribute vec4 al_color;
attribute vec4 al_pos;
attribute vec2 al_texcoord;
uniform mat4 al_projview_matrix;

//texture movement
uniform vec3 tex_move;

//masking
uniform int mask_mode;
uniform vec4 m_c;

// input to fragment shader
varying vec4 varying_colour;
varying vec2 varying_texcoord;

void main()
{
  if(mask_mode==1)//multiply mode done here
  {
    varying_colour = al_color * m_c;
  }
  else
  {
    varying_colour = al_color;
  }
  gl_Position = al_projview_matrix * al_pos;
  varying_texcoord[0] = al_texcoord[0] * tex_move[2] + tex_move[0];
  varying_texcoord[1] = 1.0 + tex_move[1] - (1.0 - al_texcoord[1]) * tex_move[2];
}
