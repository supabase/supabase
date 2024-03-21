export function Dot(x, y, w, h, opacity, animationConfig) {
  this.x = x
  this.y = y
  this.w = w
  this.h = h
  this.opacity = opacity
  this.anim = animationConfig
  this.isVert = this.anim?.direction === 'vertical'
  // this.endPos = { x: this.anim?.speed * 10 ?? 0, y: this.anim?.speed * 10 ?? 0 }

  this.draw = function (c, clock) {
    c.fillRect(this.x, this.y, this.w, this.h)
    c.fillStyle = `rgba(255,255,255,${this.opacity})`

    c.fill()
    // if (this.anim) {
    //   const speed = clock / (this.anim.speed * 2000)
    //   const oscillationWidth = this.anim.oscillation * 2
    //   const anim = (this.anim.isReverse ? Math.cos(speed) : Math.sin(speed)) * oscillationWidth
    //   if (this.isVert) {
    //     this.x += anim
    //   } else {
    //     this.y += anim
    //   }
    // }
  }

  this.update = function (c, clock) {
    this.draw(c, clock)
  }
}
