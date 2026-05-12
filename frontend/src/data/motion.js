export const motionDurations = {
  quick: 220,
  smooth: 420,
  reveal: 620
}

export const fadeUp = {
  initial: {
    opacity: 0,
    y: 28,
    filter: 'blur(10px)'
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 24,
      mass: 0.7
    }
  }
}

export const panelEnter = {
  initial: {
    opacity: 0,
    y: 18,
    scale: 0.98
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 130,
      damping: 20,
      mass: 0.8
    }
  }
}

export const listItem = {
  initial: {
    opacity: 0,
    y: 18
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 180,
      damping: 24
    }
  }
}

export const pressable = {
  hovered: {
    y: -3,
    transition: {
      duration: motionDurations.quick
    }
  },
  tapped: {
    scale: 0.97,
    transition: {
      duration: 120
    }
  }
}

export const progressFill = {
  initial: {
    scaleX: 0,
    transformOrigin: '0% 50%'
  },
  visible: {
    scaleX: 1,
    transition: {
      duration: motionDurations.reveal,
      ease: 'easeOut'
    }
  }
}

export const staggerDelay = (index, base = 90, step = 60) => base + index * step
