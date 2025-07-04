"use client"

import { motion } from "framer-motion"

interface PreloaderIconProps {
  size?: number
  className?: string
  animationsEnabled?: boolean
}

export function PreloaderIcon({ size = 40, animationsEnabled = true, className = "" }: PreloaderIconProps) {
  const scale = size / 200 // Scale factor based on original 200px circle1

  if (!animationsEnabled) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <div 
          className="absolute rounded-full bg-white"
          style={{
            width: 200 * scale,
            height: 200 * scale,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0px 0px ${10 * scale}px red, 0px 0px ${20 * scale}px blue, 0px 0px ${21 * scale}px green`,
          }}
        >
          <div 
            className="absolute bg-black"
            style={{
              width: 180 * scale,
              height: 180 * scale,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div 
              className="absolute rounded-full bg-white"
              style={{
                width: 160 * scale,
                height: 160 * scale,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: `0px 0px ${10 * scale}px red, 0px 0px ${20 * scale}px blue, 0px 0px ${21 * scale}px green`,
              }}
            >
              <div 
                className="absolute bg-black"
                style={{
                  width: 130 * scale,
                  height: 130 * scale,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <style jsx>{`
        .preloader-icon-container {
          width: ${size}px;
          height: ${size}px;
          position: relative;
          overflow: hidden;
        }

        .icon-circle1 {
          width: ${200 * scale}px;
          height: ${200 * scale}px;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          translate: -50% -50%;
          background-color: white;
          box-shadow: 0px 0px ${10 * scale}px red, 0px 0px ${20 * scale}px blue, 0px 0px ${21 * scale}px green;
          animation: icon-grow 2s linear(
            0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
            0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
            0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
            0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
            0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
          ) infinite alternate,
          icon-rot 4s ease 1s infinite;
          will-change: contents;
        }

        .icon-circle2 {
          width: ${180 * scale}px;
          height: ${180 * scale}px;
          position: absolute;
          top: 50%;
          left: 50%;
          translate: -50% -50%;
          background-color: rgb(0, 0, 0);
          animation: icon-grow 1s linear(
            0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
            0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
            0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
            0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
            0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
          ) infinite alternate,
          icon-rot 1s ease 2s infinite;
          will-change: contents;
        }

        .icon-circle3 {
          width: ${160 * scale}px;
          height: ${160 * scale}px;
          position: absolute;
          top: 50%;
          left: 50%;
          translate: -50% -50%;
          border-radius: 50%;
          background-color: rgb(255, 255, 255);
          box-shadow: 0px 0px ${10 * scale}px red, 0px 0px ${20 * scale}px blue, 0px 0px ${21 * scale}px green;
          animation: icon-grow 1s linear(
            0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
            0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
            0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
            0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
            0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
          ) infinite alternate,
          icon-rot 2s ease 3s infinite;
          will-change: contents;
        }

        .icon-circle4 {
          width: ${130 * scale}px;
          height: ${130 * scale}px;
          position: absolute;
          top: 50%;
          left: 50%;
          translate: -50% -50%;
          background-color: rgb(0, 0, 0);
          animation: icon-grow 4s linear(
            0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
            0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
            0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
            0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
            0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
          ) infinite alternate,
          icon-rot 1s ease 2s infinite;
        }

        @keyframes icon-grow {
          0% {
            scale: 0.9;
          }
          100% {
            scale: 1;
          }
        }

        @keyframes icon-rot {
          0% {
            rotate: 0turn;
          }
          100% {
            rotate: 0.25turn;
          }
        }
      `}</style>

      <div className="preloader-icon-container">
        <div className="icon-circle1">
          <div className="icon-circle2">
            <div className="icon-circle3">
              <div className="icon-circle4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
