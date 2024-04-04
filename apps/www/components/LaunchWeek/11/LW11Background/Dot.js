export function Dot(x, y, w, h, opacity, animationConfig, color = '255,255,255') {
  this.x = x
  this.y = y
  this.w = w
  this.h = h
  this.opacity = opacity
  this.anim = animationConfig
  this.isVert = this.anim?.direction === 'vertical'

  this.draw = function (c) {
    c.fillRect(this.x, this.y, this.w, this.h)
    c.fillStyle = `rgba(${color},${this.opacity})`

    c.fill()
  }

  this.update = function (c, clock) {
    this.draw(c, clock)
  }
}
