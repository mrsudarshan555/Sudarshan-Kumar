import React, { useCallback, useEffect, useRef, useState } from 'react';

interface MayraLiveScreenProps {
  onOpenChat?: () => void;
  onOpenHome?: () => void;
  onEndSession?: () => void;
  onOpenMemory?: () => void;
}

export const MayraLiveScreen: React.FC<MayraLiveScreenProps> = ({
  onOpenChat,
  onOpenHome,
  onEndSession,
  onOpenMemory
}) => {
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [camOn, setCamOn] = useState(false);
  const [transcriptOn, setTranscriptOn] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [flipSpin, setFlipSpin] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  const startCam = useCallback(async (nextFacing = facing) => {
    try {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
    } catch {
      setCamOn(false);
    }
  }, [facing]);

  useEffect(() => {
    startCam(facing);
    return () => stopCam();
  }, []);

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFlipSpin(false);
    requestAnimationFrame(() => setFlipSpin(true));
    setFacing(next);
    if (camOn) startCam(next);
  };

  const endSession = () => {
    stopCam();
    onEndSession?.();
  };

  return (
    <div className="h-full w-full overflow-hidden bg-black font-sans">
      <style>{`
        .mayra-live-screen, .mayra-live-screen * { box-sizing: border-box; }
        .mayra-live-screen { height: 100%; display: flex; flex-direction: column; background: linear-gradient(#000 0 22%, #1e5fbf 78%, #2b6fd8 100%); }
        .mayra-live-topbar { height: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; padding-top: env(safe-area-inset-top, 0px); }
        .mayra-live-label { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 17px; }
        .mayra-live-transcript { position: absolute; right: 20px; top: 26px; color: #fff; background: none; border: none; padding: 4px; cursor: pointer; display: flex; }
        .mayra-live-transcript .slash, .mayra-live-mic .slash { opacity: 0; transition: opacity .15s; }
        .mayra-live-transcript.off .slash, .mayra-live-mic.muted .slash { opacity: 1; }
        .mayra-live-cam-wrap { flex: 1; padding: 0; display: flex; min-height: 0; }
        .mayra-live-preview { position: relative; flex: 1; border-radius: 28px; overflow: hidden; background-image: linear-gradient(45deg,#b9b9b9 25%,transparent 25%),linear-gradient(-45deg,#b9b9b9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#b9b9b9 75%),linear-gradient(-45deg,transparent 75%,#b9b9b9 75%); background-size:44px 44px; background-position:center; background-color:#e6e6e6; }
        .mayra-live-preview video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; }
        .mayra-live-preview.live video { display:block; }
        .mayra-live-flip { position:absolute; right:16px; bottom:16px; width:44px; height:44px; border-radius:50%; background:rgba(30,30,30,.55); border:none; display:flex; align-items:center; justify-content:center; color:#fff; }
        .mayra-live-flip.spin svg { animation: mayraLiveFlip .4s ease; }
        @keyframes mayraLiveFlip { from { transform:rotate(0deg); } to { transform:rotate(180deg); } }
        .mayra-live-bottom { flex-shrink:0; display:flex; align-items:center; justify-content:space-around; padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px)); }
        .mayra-live-ctrl { border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .mayra-live-video { width:72px; height:50px; border-radius:25px; background:rgba(255,255,255,.18); color:#fff; }
        .mayra-live-home { width:60px; height:50px; border-radius:22px; background:rgba(255,255,255,.18); color:#fff; }
        .mayra-live-mic { width:60px; height:50px; border-radius:22px; background:rgba(255,255,255,.18); color:#fff; }
        .mayra-live-end { width:60px; height:50px; border-radius:25px; background:#e8362b; color:#fff; }
      `}</style>

      <div className="mayra-live-screen">
        <div className="mayra-live-topbar">
          <div className="mayra-live-label">
            <svg width="16" height="16" viewBox="0 0 30 28" fill="none" aria-hidden="true">
              <rect x="3" y="12" width="4" height="10" rx="2" fill="#fff"/>
              <rect x="10.5" y="5" width="4" height="20" rx="2" fill="#fff"/>
              <rect x="18" y="13" width="4" height="8" rx="2" fill="#fff"/>
              <path d="M25 1C25.15 3 25.5 4.2 26.1 4.9C26.7 5.6 27.7 5.9 29.5 6.05C27.7 6.2 26.7 6.5 26.1 7.2C25.5 7.9 25.15 9.1 25 11.1C24.85 9.1 24.5 7.9 23.9 7.2C23.3 6.5 22.3 6.2 20.5 6.05C22.3 5.9 23.3 5.6 23.9 4.9C24.5 4.2 24.85 3 25 1Z" fill="#fff"/>
            </svg>
            <span>Mayra Live</span>
          </div>
          <button className={`mayra-live-transcript ${transcriptOn ? '' : 'off'}`} onClick={() => setTranscriptOn(v => !v)} aria-label="Toggle transcript">
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/>
              <line x1="4" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <line className="slash" x1=".5" y1="17.5" x2="21.5" y2=".5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="mayra-live-cam-wrap">
          <div className={`mayra-live-preview ${camOn ? 'live' : ''}`}>
            <video ref={videoRef} autoPlay playsInline muted />
            <button className={`mayra-live-flip ${flipSpin ? 'spin' : ''}`} onClick={flipCamera} aria-label="Switch camera">
              <svg width="28" height="22" viewBox="0 0 1536 1193" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <path fill="currentColor" fillRule="evenodd" d="M 965 740 L 960 735 L 952 731 L 938 731 L 932 734 L 927 739 L 924 745 L 923 752 L 922 753 L 921 765 L 920 766 L 917 781 L 915 784 L 911 797 L 903 813 L 889 834 L 858 862 L 841 874 L 831 879 L 829 879 L 822 883 L 816 884 L 813 886 L 806 887 L 794 891 L 776 892 L 775 893 L 764 893 L 763 894 L 759 894 L 753 897 L 747 903 L 743 914 L 743 923 L 748 935 L 755 940 L 769 944 L 785 944 L 786 943 L 791 943 L 792 942 L 799 941 L 803 939 L 820 937 L 824 935 L 831 934 L 848 926 L 850 926 L 872 914 L 875 911 L 884 906 L 904 889 L 919 874 L 933 857 L 948 833 L 957 813 L 965 790 L 966 781 L 967 780 L 967 776 L 970 765 L 970 752 L 968 745Z M 798 561 L 793 556 L 783 552 L 777 552 L 776 551 L 757 552 L 752 554 L 740 556 L 736 558 L 725 559 L 713 563 L 706 567 L 704 567 L 680 580 L 677 583 L 674 584 L 664 591 L 634 620 L 620 638 L 617 644 L 613 649 L 603 669 L 602 674 L 598 682 L 597 688 L 595 691 L 595 694 L 591 707 L 591 712 L 589 718 L 589 724 L 588 725 L 588 731 L 589 732 L 590 739 L 595 747 L 602 752 L 608 754 L 617 754 L 625 750 L 630 745 L 630 743 L 632 740 L 635 718 L 645 688 L 658 665 L 668 652 L 695 628 L 709 618 L 718 613 L 720 613 L 733 607 L 750 602 L 762 601 L 763 600 L 784 599 L 793 595 L 798 590 L 802 578 L 801 568Z M 172 451 L 171 452 L 167 452 L 163 454 L 156 455 L 153 457 L 146 459 L 124 472 L 104 492 L 98 500 L 89 517 L 89 520 L 87 522 L 82 539 L 82 546 L 81 547 L 81 572 L 82 573 L 82 581 L 84 588 L 86 591 L 86 595 L 96 616 L 99 619 L 105 629 L 122 646 L 141 658 L 162 666 L 175 668 L 176 669 L 205 669 L 215 666 L 219 666 L 225 663 L 233 661 L 253 650 L 264 641 L 279 624 L 289 608 L 296 589 L 299 571 L 300 570 L 300 551 L 299 550 L 296 531 L 285 505 L 276 492 L 255 471 L 232 458 L 213 452 L 201 451 L 200 450Z M 177 493 L 183 493 L 184 492 L 196 492 L 197 493 L 204 493 L 205 494 L 208 494 L 211 496 L 216 497 L 226 502 L 228 504 L 232 506 L 241 514 L 241 515 L 244 518 L 244 519 L 249 525 L 254 535 L 255 542 L 256 543 L 256 545 L 257 546 L 257 549 L 258 550 L 258 570 L 257 571 L 257 574 L 255 578 L 255 581 L 254 582 L 254 586 L 253 587 L 253 589 L 251 591 L 249 596 L 243 603 L 241 607 L 233 614 L 230 615 L 225 619 L 219 622 L 217 622 L 212 625 L 209 625 L 208 626 L 205 626 L 204 627 L 195 627 L 194 628 L 187 628 L 186 627 L 178 627 L 177 626 L 173 626 L 172 625 L 169 625 L 166 623 L 164 623 L 154 618 L 152 616 L 151 616 L 136 601 L 136 600 L 133 597 L 126 583 L 126 581 L 125 580 L 125 576 L 124 575 L 124 571 L 123 570 L 123 565 L 122 564 L 122 555 L 123 554 L 123 550 L 124 549 L 124 545 L 125 544 L 125 540 L 126 539 L 126 537 L 133 523 L 137 519 L 137 518 L 149 506 L 150 506 L 154 502 L 156 501 L 158 501 L 162 498 L 164 498 L 170 495 L 172 495 L 173 494 L 176 494Z M 766 381 L 697 390 L 627 415 L 570 450 L 514 502 L 471 563 L 446 618 L 431 675 L 427 707 L 427 758 L 442 835 L 470 900 L 507 955 L 550 999 L 598 1034 L 655 1062 L 729 1081 L 789 1084 L 850 1077 L 923 1053 L 979 1021 L 1037 969 L 1073 923 L 1109 850 L 1125 789 L 1129 712 L 1117 642 L 1093 578 L 1073 543 L 1046 506 L 1002 462 L 953 428 L 887 398 L 822 383Z M 747 441 L 805 441 L 868 454 L 917 475 L 961 505 L 1006 550 L 1036 596 L 1058 650 L 1068 702 L 1068 761 L 1058 814 L 1034 872 L 1002 919 L 961 959 L 900 997 L 849 1015 L 789 1024 L 764 1024 L 727 1019 L 679 1006 L 622 978 L 582 947 L 540 900 L 511 849 L 493 795 L 487 751 L 489 688 L 498 648 L 519 597 L 554 546 L 594 506 L 642 474 L 684 455Z M 586 152 L 587 175 L 595 194 L 602 204 L 610 212 L 621 220 L 644 228 L 669 228 L 670 229 L 911 228 L 932 220 L 947 209 L 954 201 L 961 189 L 967 169 L 967 152 L 965 142 L 959 127 L 955 123 L 950 114 L 943 107 L 928 98 L 921 95 L 905 92 L 646 92 L 641 94 L 635 94 L 618 102 L 604 114 L 595 126 L 590 136Z M 626 160 L 630 148 L 632 146 L 633 143 L 639 138 L 651 133 L 900 133 L 901 134 L 908 135 L 914 138 L 922 145 L 927 157 L 927 164 L 926 165 L 925 171 L 917 181 L 911 185 L 901 186 L 900 187 L 661 187 L 660 186 L 647 186 L 642 183 L 640 183 L 629 171 L 627 165 L 627 161Z M 135 121 L 124 155 L 125 240 L 77 250 L 42 271 L 18 300 L 3 342 L 3 1090 L 18 1135 L 48 1169 L 111 1193 L 1427 1193 L 1474 1178 L 1510 1146 L 1533 1087 L 1533 349 L 1518 300 L 1493 270 L 1464 252 L 1425 243 L 1116 243 L 1024 48 L 992 19 L 939 4 L 614 4 L 571 14 L 522 58 L 436 243 L 413 242 L 411 140 L 401 119 L 382 104 L 172 99Z M 1470 408 L 1471 1021 L 1442 1003 L 1420 998 L 1133 998 L 1131 994 L 1154 961 L 1179 913 L 1206 834 L 1217 767 L 1217 697 L 1201 613 L 1178 550 L 1138 480 L 1097 429 L 1118 432 L 1421 432 L 1446 425Z M 90 1072 L 97 1052 L 122 1038 L 521 1037 L 443 944 L 395 836 L 385 788 L 382 713 L 393 636 L 407 592 L 435 534 L 471 482 L 523 429 L 571 394 L 625 366 L 686 346 L 736 337 L 799 336 L 864 345 L 920 362 L 978 390 L 1029 425 L 1105 508 L 1154 607 L 1174 720 L 1171 785 L 1158 848 L 1138 900 L 1106 956 L 1034 1037 L 1414 1038 L 1439 1052 L 1445 1077 L 1431 1101 L 1383 1108 L 196 1108 L 111 1104 L 97 1093Z M 92 352 L 94 345 L 97 340 L 103 334 L 112 329 L 117 328 L 422 328 L 432 332 L 441 341 L 444 347 L 447 359 L 446 360 L 446 366 L 442 373 L 442 375 L 432 385 L 424 389 L 415 391 L 120 391 L 115 390 L 105 385 L 97 377 L 92 365Z M 1091 357 L 1094 346 L 1100 336 L 1112 329 L 1123 328 L 1124 327 L 1126 328 L 1420 328 L 1425 329 L 1435 334 L 1438 337 L 1443 347 L 1445 356 L 1445 362 L 1442 373 L 1438 379 L 1430 386 L 1422 390 L 1417 390 L 1416 391 L 1120 391 L 1115 390 L 1107 386 L 1098 378 L 1093 369 L 1093 366 L 1091 362Z M 206 183 L 208 181 L 328 181 L 330 183 L 330 221 L 331 222 L 331 223 L 330 224 L 330 227 L 328 229 L 327 229 L 326 230 L 319 230 L 318 229 L 208 229 L 206 226Z M 967 69 L 986 94 L 1065 276 L 1086 294 L 1063 318 L 1052 342 L 1056 389 L 992 347 L 924 316 L 867 300 L 801 291 L 718 295 L 661 307 L 592 333 L 545 359 L 476 414 L 410 492 L 371 566 L 347 642 L 338 717 L 347 822 L 382 923 L 426 996 L 115 998 L 86 1007 L 57 1033 L 56 394 L 80 418 L 116 432 L 439 428 L 473 402 L 487 363 L 476 321 L 452 295 L 472 290 L 484 278 L 566 90 L 584 68 L 608 57 L 941 57Z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mayra-live-bottom">
          <button className="mayra-live-ctrl mayra-live-home" onClick={onOpenHome} aria-label="Home">
            <svg width="24" height="24" viewBox="0 0 1536 1404" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <path fill="currentColor" fillRule="evenodd" d="M 1384 764 L 1332 711 L 1300 707 L 1284 722 L 1275 782 L 1269 1257 L 1204 1283 L 1009 1281 L 993 1272 L 994 867 L 983 814 L 959 778 L 913 743 L 857 729 L 679 729 L 609 747 L 566 784 L 535 847 L 526 1291 L 333 1285 L 276 1267 L 265 1186 L 262 768 L 233 722 L 190 719 L 155 752 L 145 798 L 144 1211 L 159 1291 L 223 1364 L 299 1394 L 558 1401 L 618 1383 L 645 1326 L 652 855 L 695 838 L 833 836 L 876 844 L 894 864 L 894 1311 L 903 1382 L 938 1395 L 1232 1399 L 1281 1386 L 1350 1336 L 1391 1248 L 1395 826Z M 7 651 L 12 680 L 36 714 L 54 724 L 85 714 L 205 613 L 661 198 L 749 124 L 769 116 L 828 160 L 1452 716 L 1467 724 L 1491 716 L 1516 695 L 1531 668 L 1516 632 L 1469 584 L 928 95 L 843 28 L 786 7 L 738 11 L 707 23 L 603 97 L 76 570 L 24 623Z"/>
            </svg>
          </button>
          <button className="mayra-live-ctrl mayra-live-home" onClick={onOpenMemory} aria-label="Memory">
            <svg width="21" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M8 9H16M8 12H16M8 15H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <button className={`mayra-live-ctrl mayra-live-mic ${micMuted ? 'muted' : ''}`} onClick={() => setMicMuted(v => !v)} aria-label="Mute">
            <svg width="18" height="22" viewBox="0 0 20 24" fill="none" aria-hidden="true">
              <path d="M10 15.5C12.2091 15.5 14 13.7091 14 11.5V5.5C14 3.29086 12.2091 1.5 10 1.5C7.79086 1.5 6 3.29086 6 5.5V11.5C6 13.7091 7.79086 15.5 10 15.5Z" fill="currentColor"/>
              <path d="M17 11.5C17 15.0899 14.0899 18 10.5 18H9.5C5.91015 18 3 15.0899 3 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="10" y1="18" x2="10" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="6.5" y1="22" x2="13.5" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line className="slash" x1="1.5" y1="22.5" x2="18.5" y2="1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="mayra-live-ctrl mayra-live-video" onClick={onOpenChat} aria-label="Toggle chat">
            <svg width="22" height="20" viewBox="0 0 24 22" fill="none" aria-hidden="true">
              <path d="M22 11C22 15.4183 17.5228 19 12 19C10.7 19 9.46 18.81 8.33 18.46L3 20L4.55 15.66C3.58 14.34 3 12.73 3 11C3 6.58172 7.47715 3 13 3C17.4183 3 22 6.58172 22 11Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
