"use client";

import { useState, useEffect } from "react";
import LostPetReport from "./LostPetReport";

type Pet = {
  id: string;
  name?: string;
  avatar_url?: string | string[];
  lost_mode?: boolean;
  lost_since?: string;
};

type Owner = {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
};

type Props = {
  pet: Pet;
  owner: Owner | null;
  onToggleLostMode?: () => void;
  onLostModeChange?: (newLostMode: boolean) => void; // 新增：状态变化回调
  isVisible?: boolean; // 控制显示/隐藏
};

export default function LostFoundModule({ 
  pet, 
  owner, 
  onToggleLostMode, 
  onLostModeChange,
  isVisible = true // 默认显示
}: Props) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    let enterTimer: ReturnType<typeof setTimeout> | undefined;
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    if (isVisible) {
      // 开始显示动画
      setShouldRender(true);
      setIsAnimating(true);
      setAnimationClass("animate-slide-out"); // 先设置为隐藏状态
      // 短暂延迟后开始入场动画
      enterTimer = setTimeout(() => {
        setAnimationClass("animate-slide-in");
      }, 50);
      // 3秒后动画完成
      doneTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
    } else {
      // 开始隐藏动画
      setIsAnimating(true);
      setAnimationClass("animate-slide-out");
      // 3秒后完全隐藏组件
      exitTimer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
        setAnimationClass("");
      }, 3000);
    }

    return () => {
      if (enterTimer) clearTimeout(enterTimer);
      if (doneTimer) clearTimeout(doneTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [isVisible]);

  // 如果不应该渲染，直接返回 null
  if (!shouldRender) {
    return null;
  }

  // 渲染带动画的组件
  return (
    <div 
      className="transition-all duration-[3000ms] ease-in-out overflow-hidden"
      style={{
        transform: animationClass === "animate-slide-out" 
          ? "translateY(-20px) scale(0.95)" 
          : "translateY(0) scale(1)",
        opacity: animationClass === "animate-slide-out" ? 0 : 1,
        maxHeight: animationClass === "animate-slide-out" ? "0px" : "1000px",
        marginBottom: animationClass === "animate-slide-out" ? "0px" : "8px",
      }}
    >
      <LostPetReport 
        pet={pet} 
        owner={owner} 
        onToggleLostMode={onToggleLostMode}
        onLostModeChange={onLostModeChange}
      />
    </div>
  );
}
