"use client"

import { useEffect, useState, useRef } from "react"
import { Volume2, VolumeX, Power, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function VintageTV() {
  const [currentChannel, setCurrentChannel] = useState(-1)
  const [showStatic, setShowStatic] = useState(false)
  const [isMuted, setIsMuted] = useState(false) // Default to sound on
  const [isPowered, setIsPowered] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [inputChannel, setInputChannel] = useState("")
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const youtubeChannelIDs = [
    "jfKfPfyJRdk", // 0: Lofi Hip Hop Radio (Lofi Girl) - Kept
    "d8Oc90QevaI", // 1: Progressive House - Kept
    "WsDyRAPFBC8", // 2: Deep and Melodic House - Kept
    "mKCieTImjvU", // 3: Fireplace - Kept (Assuming this one works)
    "dpK9743QKT0", // 4: Monterey Bay Aquarium Jelly Cam - Kept Original
    "N6-2fVsFV8E", // 5: Brooks Falls Brown Bears (Explore.org) - Kept Original
    "r4k4u3ZwTyI", // 6: Norway Train Cab View (Bergen Line) - Kept Original
    "Fqy6DQ9aM8Q", // 7: Times Square NYC Live Cam - Kept Original
    "5qap5aO4i9A", // 8: Alternative Lofi Radio (Chillhop) - Kept Original
    "DWcJFNfaw9c", // 9: Puppy Playroom (Explore.org) - Kept Original
    "mhJRzQsLZGg", // 10: Coral Reef Aquarium (Monterey Bay) - Kept Original
    "86YLFOog4GM", // 11: NASA ISS Live Feed (Replaced Fireplace)
    "1EiC9bvVGnk", // 12: Wave Crash Ocean Sounds - Kept Original
    "XBPjVzSoepo", // 13: Space Ambient Music Radio - Kept Original
    "kgx4WGK0oNU", // 14: Relaxing Jazz Radio (Coffee Shop Radio) (Replaced Animal Crossing)
    "MVPTGNGiI-4", // 15: Synthwave Radio (Replaced Minecraft)
    "HpdO5Kq3o7Y", // 16: Tokyo Shibuya Crossing Cam (ANNnews) (Replaced Jazz)
    "N4Yvc1QSaIA", // 17: African Wildlife Cam (Explore.org) (Replaced Synthwave)
    "n_Dv4JMiwK8", // 18: Rain on Window Sounds (Replaced Fireplace, Moved from 19)
    "pv6jMg6NChY", // 19: Venice Grand Canal Cam (Live Cam Venezia) (Replaced Rain)
  ];
  
  // Corresponding names for the channels/streams
  const channelNames = [
    "Lofi Hip Hop", // 0 - Kept
    "Progressive House", // 1 - Kept
    "Deep House", // 2 - Kept
    "Fireplace", // 3 - Kept
    "Jellyfish Cam", // 4 - Kept
    "Bear Cam", // 5 - Kept
    "Norway Train", // 6 - Kept
    "Times Square", // 7 - Kept
    "Chillhop Radio", // 8 - Kept
    "Puppy Playroom", // 9 - Kept
    "Coral Reef Cam", // 10 - Kept
    "NASA ISS Feed", // 11 - Replaced
    "Ocean Waves", // 12 - Kept
    "Space Ambient", // 13 - Kept
    "Jazz Radio", // 14 - Replaced
    "Synthwave Radio", // 15 - Replaced
    "Tokyo Crossing", // 16 - Replaced
    "African Wildlife", // 17 - Replaced
    "Rain Sounds", // 18 - Replaced
    "Venice Canal Cam", // 19 - Replaced
  ];
  

  // Handle keyboard input for channel switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key presses if modifier keys are held
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      const key = event.key
      const digit = Number.parseInt(key, 10)

      // Check if the key pressed is a number
      if (!isNaN(digit)) {
        if (!isPowered) return

        // Add digit to input channel
        const newInput = inputChannel + digit
        setInputChannel(newInput)

        // Clear any existing timeout
        if (inputTimeout) {
          clearTimeout(inputTimeout)
        }

        // Set a timeout to process the channel after a short delay
        const timeout = setTimeout(() => {
          const channelNum = Number.parseInt(newInput, 10)
          if (channelNum < youtubeChannelIDs.length) {
            if (channelNum !== currentChannel) {
              changeChannel(channelNum)
            }
          }
          setInputChannel("")
        }, 1500)

        setInputTimeout(timeout)
      }

      // Handle M key for mute toggle
      if (event.key.toLowerCase() === "m") {
        toggleMute()
      }

      // Handle P key for power toggle
      if (event.key.toLowerCase() === "p") {
        togglePower()
      }

      // Handle arrow keys for channel up/down
      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        nextChannel()
      }
      if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        prevChannel()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (inputTimeout) {
        clearTimeout(inputTimeout)
      }
    }
  }, [currentChannel, isPowered, inputChannel, inputTimeout])

  // Next and previous channel functions
  const nextChannel = () => {
    if (!isPowered || currentChannel === -1) return
    const nextCh = (currentChannel + 1) % youtubeChannelIDs.length
    changeChannel(nextCh)
  }

  const prevChannel = () => {
    if (!isPowered || currentChannel === -1) return
    const prevCh = currentChannel === 0 ? youtubeChannelIDs.length - 1 : currentChannel - 1
    changeChannel(prevCh)
  }

  // Change channel with static effect
  const changeChannel = (channelNum: number) => {
    if (!isPowered) return

    setShowStatic(true)

    // Update the channel after a short delay for the static effect
    setTimeout(() => {
      setCurrentChannel(channelNum)
      setShowStatic(false)

      // Fix for sound bug - ensure mute state is properly applied after channel change
      setTimeout(() => {
        if (iframeRef.current) {
          const message = isMuted
            ? '{"event":"command","func":"mute","args":""}'
            : '{"event":"command","func":"unMute","args":""}'
          iframeRef.current.contentWindow?.postMessage(message, "*")
        }
      }, 1000) // Give the iframe time to load
    }, 800)
  }

  // Toggle mute state
  const toggleMute = () => {
    if (!isPowered) return

    setIsMuted(!isMuted)
    if (iframeRef.current) {
      const message = isMuted
        ? '{"event":"command","func":"unMute","args":""}'
        : '{"event":"command","func":"mute","args":""}'
      iframeRef.current.contentWindow?.postMessage(message, "*")
    }
  }

  // Toggle power state
  const togglePower = () => {
    setIsPowered(!isPowered)
    if (isPowered) {
      // Turning off
      setShowStatic(true)
      setTimeout(() => {
        setShowStatic(false)
      }, 300)
    } else {
      // Turning on
      setShowStatic(true)
      setTimeout(() => {
        setShowStatic(false)
        // Reset to no channel when turning on
        setCurrentChannel(-1)
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-0">
      <div
        className={cn(
          "tv-container relative w-[100vw] h-[100vh] max-w-[2000px] max-h-[1200px] overflow-hidden",
          "bg-black",
          "border-t-[8px] border-[#2D1E18]",
          "flex flex-col items-center",
          "transition-all duration-500",
          !isPowered && "opacity-90",
        )}
      >
        {/* TV Brand Logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-[#2D1E18] px-6 py-1 rounded-b-md">
          <div className="text-[#D7CCC8] text-xs sm:text-sm font-bold tracking-widest">RETROVIEW</div>
        </div>

        {/* Channel Display - Top Right */}
        {isPowered && (currentChannel !== -1 || inputChannel !== "") && (
          <div className={cn("absolute top-4 right-4 z-20", "flex flex-col items-center")}>
            <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Channel</div>
            <div
              className={cn(
                "channel-display font-['Orbitron',sans-serif] font-medium text-2xl sm:text-3xl md:text-4xl",
                "bg-gradient-to-b from-[#0a0a0a] to-[#151515]",
                "text-[#00ffcc] px-3 py-1 sm:px-4 sm:py-2 rounded-md",
                "border-2 border-[#333]",
                "shadow-[inset_0_0_10px_rgba(0,255,204,0.3),0_0_15px_rgba(0,0,0,0.7)]",
                "text-shadow-[0_0_8px_rgba(0,255,204,0.8)]",
                "min-w-[70px] sm:min-w-[90px] text-center",
                "transition-all duration-150",
                "relative overflow-hidden",
                "after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-b after:from-transparent after:via-transparent after:to-[rgba(0,255,204,0.07)] after:pointer-events-none",
                "before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,204,0.1)_50%,transparent_100%)] before:animate-scan before:pointer-events-none",
              )}
            >
              {inputChannel !== "" ? inputChannel : currentChannel}
            </div>
          </div>
        )}

        {/* TV Screen */}
        <div
          className={cn(
            "tv-screen relative w-full flex-grow overflow-hidden",
            "bg-black",
            "shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_0_60px_rgba(255,255,255,0.07)]",
            "flex justify-center items-center",
            "before:content-[''] before:absolute before:inset-0 before:z-[2]",
            "before:bg-[linear-gradient(140deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_55%)]",
            "before:pointer-events-none",
            !isPowered && "bg-[#050505]",
          )}
        >
          {/* Static Overlay */}
          <div
            className={cn(
              "static-overlay absolute -top-[10%] -left-[10%] w-[120%] h-[120%] z-[10] pointer-events-none",
              "bg-[repeating-linear-gradient(rgba(0,0,0,0.75)_0_1px,transparent_1px_100%),repeating-linear-gradient(90deg,rgba(255,255,255,0.55)_0_1px,transparent_1px_100%)]",
              "bg-[size:100%_2px,3px_100%]",
              "mix-blend-screen contrast-[1.5]",
              "animate-static",
              showStatic ? "opacity-85" : "opacity-0",
            )}
          ></div>

          {/* Placeholder Content */}
          {currentChannel === -1 && !showStatic && isPowered && (
            <div className="placeholder-content w-full h-full flex flex-col justify-center items-center z-[1] text-center p-4">
              <div className="text-[#555] font-['Press_Start_2P',monospace] text-xl sm:text-2xl md:text-3xl lg:text-4xl text-shadow-sm mb-8">
                ENTER CHANNEL NUMBER
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-[#444] text-xs sm:text-sm md:text-base max-w-4xl">
                {channelNames.map((name, idx) => (
                  <div
                    key={idx}
                    className="channel-button p-2 border border-[#333] rounded text-center cursor-pointer hover:bg-[#222] hover:text-[#666] transition-colors"
                    onClick={() => changeChannel(idx)}
                  >
                    {idx}: {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube Iframe with Control Blocker */}
          {currentChannel !== -1 && isPowered && (
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                className="w-full h-full absolute top-0 left-0 z-[1]"
                src={`https://www.youtube.com/embed/${youtubeChannelIDs[currentChannel]}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1&fs=0&color=white&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
                allow="autoplay; encrypted-media"
                title={`YouTube Live Channel ${currentChannel}`}
              />
              {/* Invisible overlay to prevent YouTube controls from showing */}
              <div
                ref={overlayRef}
                className="absolute inset-0 z-[2]"
                onClick={(e) => e.preventDefault()}
                onDoubleClick={(e) => e.preventDefault()}
              ></div>
            </div>
          )}

          {/* Power Off Screen */}
          {!isPowered && !showStatic && (
            <div className="absolute inset-0 bg-black z-[5] flex items-center justify-center">
              <div className="w-1 h-1 bg-white opacity-40 rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        {/* Retro Controls Panel - Bottom Right */}
        <div
          className={cn(
            "absolute bottom-4 right-4 z-20",
            "bg-[#111] rounded-lg border border-[#333]",
            "shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "p-2 sm:p-3",
            "transition-opacity duration-300",
            !isPowered && "opacity-50",
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Channel Controls */}
            <div className="flex items-center">
              <button
                onClick={prevChannel}
                disabled={!isPowered || currentChannel === -1}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-l-md flex items-center justify-center",
                  "bg-gradient-to-br from-[#333] to-[#222]",
                  "border-y border-l border-[#444]",
                  "text-gray-300",
                  "hover:from-[#444] hover:to-[#333] transition-colors",
                  (!isPowered || currentChannel === -1) && "opacity-50 pointer-events-none",
                )}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={nextChannel}
                disabled={!isPowered || currentChannel === -1}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-r-md flex items-center justify-center",
                  "bg-gradient-to-br from-[#333] to-[#222]",
                  "border-y border-r border-[#444]",
                  "text-gray-300",
                  "hover:from-[#444] hover:to-[#333] transition-colors",
                  (!isPowered || currentChannel === -1) && "opacity-50 pointer-events-none",
                )}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Volume Button */}
            <button
              onClick={toggleMute}
              className={cn(
                "volume-button w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center",
                "bg-gradient-to-br from-[#333] to-[#222]",
                "border border-[#444]",
                "text-gray-300",
                "hover:from-[#444] hover:to-[#333] transition-colors",
                !isPowered && "opacity-50 pointer-events-none",
              )}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "settings-button w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center",
                "bg-gradient-to-br from-[#333] to-[#222]",
                "border border-[#444]",
                "text-gray-300",
                "hover:from-[#444] hover:to-[#333] transition-colors",
                !isPowered && "opacity-50 pointer-events-none",
                isSettingsOpen && "bg-[#444] text-white",
              )}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Power Button */}
            <button
              onClick={togglePower}
              className={cn(
                "power-button w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center",
                "bg-gradient-to-br from-[#333] to-[#222]",
                "border border-[#444]",
                "shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
                "hover:from-[#444] hover:to-[#333] transition-colors",
                isPowered ? "text-green-500" : "text-red-500",
              )}
            >
              <Power className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {isSettingsOpen && isPowered && (
          <div className="settings-panel absolute bottom-20 right-4 bg-[#222] border border-[#444] rounded-lg p-4 z-20 shadow-lg max-h-[70vh] overflow-auto">
            <h3 className="text-gray-300 text-sm font-bold mb-3">Channel Guide</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2">
              {channelNames.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    changeChannel(idx)
                    setIsSettingsOpen(false)
                  }}
                  className={cn(
                    "text-left px-3 py-2 rounded",
                    "text-sm text-gray-300",
                    "hover:bg-[#333] transition-colors",
                    currentChannel === idx && "bg-[#333] text-white",
                  )}
                >
                  {idx}: {name}
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Press P to toggle power</p>
              <p>Press M to toggle mute</p>
              <p>Enter numbers for channel</p>
              <p>Arrow keys to change channel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
