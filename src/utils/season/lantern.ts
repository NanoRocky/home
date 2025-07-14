/*!
 * china-lantern v1.6.0
 * (c) 2020-2021 fz6m
 * make to ts by NanoRocky
 * Released under the MIT License.
 */

import { mainStore } from "@/store";
let styleElement: HTMLStyleElement | null = null;
let lanternContainer: HTMLDivElement | null = null;

// 初始化灯笼特效
export function initLantern() {
  const store = mainStore();
  store.showLantern = true;
  if (styleElement || lanternContainer) {
    closeLantern();
  };
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.innerHTML = `
    .j-china-lantern .lantern__warpper {
      position: fixed;
      top: 12px;
      left: 40px;
      pointer-events: none;
      user-select: none;
      z-index: 999;
    }

    .j-china-lantern .lantern__warpper.lantern__secondary {
      left: calc(100% - 130px);
    }

    .j-china-lantern .lantern__warpper.lantern__secondary .lantern__box {
      animation-duration: 3s;
      animation-delay: 1s;
    }

    .j-china-lantern .lantern__box {
      position: relative;
      display: inline-block;
      width: 90px;
      height: 70px;
      background: rgba(216, 0, 15, 0.8);
      border-radius: 50% 50%;
      animation: lantern-swing 3s ease-in-out infinite alternate-reverse;
      transform-origin: 50% -70px;
      box-shadow: -5px 5px 50px 4px #fa6c00;
    }

    .j-china-lantern .lantern__box:after,
    .j-china-lantern .lantern__box:before {
      content: "";
      position: absolute;
      height: 8px;
      width: 45px;
      left: 50%;
      border: 1px solid #dc8f03;
      background: linear-gradient(
        90deg,
        #dc8f03,
        orange,
        #dc8f03,
        orange,
        #dc8f03
      );
    }

    .j-china-lantern .lantern__box:before {
      top: 0;
      border-radius: 5px 5px 0 0;
      transform: translate(-50%, -50%);
    }

    .j-china-lantern .lantern__box:after {
      bottom: 0;
      border-radius: 0 0 5px 5px;
      transform: translate(-50%, 50%);
    }

    .j-china-lantern .lantern__line {
      position: absolute;
      width: 2px;
      height: 12px;
      top: 0;
      left: 50%;
      transform: translate(-50%, -100%);
      background: #dc8f03;
    }

    .j-china-lantern .lantern__circle {
      width: 80%;
      box-sizing: border-box;
    }

    .j-china-lantern .lantern__circle,
    .j-china-lantern .lantern__circle .lantern__ellipse {
      height: 100%;
      margin: 0 auto;
      border-radius: 50%;
      border: 2px solid #dc8f03;
    }

    .j-china-lantern .lantern__circle .lantern__ellipse {
      width: 50%;
    }

    .j-china-lantern .lantern__circle .lantern__text {
      font-family: "华文行楷", "Microsoft YaHei", sans-serif;
      font-size: 24.3px;
      color: #dc8f03;
      font-weight: 700;
      line-height: 66px;
      text-align: center;
    }

    .j-china-lantern .lantern__tail {
      position: relative;
      width: 4px;
      height: 12px;
      margin: 0 auto;
      animation: lantern-swing 4s ease-in-out infinite alternate-reverse;
      background: orange;
      border-radius: 0 0 5px 5px;
    }

    .j-china-lantern .lantern__tail .lantern__junction {
      position: absolute;
      top: 0;
      left: 50%;
      width: 8px;
      height: 8px;
      transform: translate(-50%, 8.4px);
      background: #e69603;
      border-radius: 50%;
    }

    .j-china-lantern .lantern__tail .lantern__rect {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, 10.8px);
      width: 8px;
      height: 24px;
      background: orange;
      border-radius: 5px 5px 0 5px;
    }

    @keyframes lantern-swing {
      0% {
        transform: rotate(-8deg);
      }
      to {
        transform: rotate(8deg);
      }
    }

    @media (max-width: 520px) {
      .j-china-lantern {
        display: none;
      }
    }
  `;
  lanternContainer = document.createElement('div');
  lanternContainer.className = 'j-china-lantern';
  lanternContainer.innerHTML = `
    <div class="lantern__warpper">
      <div class="lantern__box">
        <div class="lantern__line"></div>
        <div class="lantern__circle">
          <div class="lantern__ellipse">
            <div class="lantern__text">新</div>
          </div>
        </div>
        <div class="lantern__tail">
          <div class="lantern__rect"></div>
          <div class="lantern__junction"></div>
        </div>
      </div>
    </div>
    <div class="lantern__warpper lantern__secondary">
      <div class="lantern__box">
        <div class="lantern__line"></div>
        <div class="lantern__circle">
          <div class="lantern__ellipse">
            <div class="lantern__text">年</div>
          </div>
        </div>
        <div class="lantern__tail">
          <div class="lantern__rect"></div>
          <div class="lantern__junction"></div>
        </div>
      </div>
    </div>
  `;
  document.head.appendChild(styleElement);
  document.body.appendChild(lanternContainer);
}

// 关闭灯笼特效
export function closeLantern() {
  if (styleElement && styleElement.parentNode === document.head) {
    document.head.removeChild(styleElement);
    styleElement = null;
  };
  if (lanternContainer && lanternContainer.parentNode === document.body) {
    document.body.removeChild(lanternContainer);
    lanternContainer = null;
  };
  const store = mainStore();
  store.showLantern = false;
};