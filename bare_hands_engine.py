import cv2
import mediapipe as mp
import math

class BareHandsEngine:
    def __init__(self):
        # MediaPipe Hands Setup
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_draw = mp.solutions.drawing_utils

    def calculate_distance(self, p1, p2):
        """Calculates 3D Euclidean distance between two hand landmarks."""
        return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)

    def detect_gestures(self, landmarks):
        """Identifies active user gestures."""
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        wrist = landmarks[0]

        # 1. Pinch Detection (Thumb + Index Distance)
        pinch_dist = self.calculate_distance(thumb_tip, index_tip)

        # 2. Fist Detection (Fingers close to wrist)
        fist_dist = self.calculate_distance(middle_tip, wrist)

        if pinch_dist < 0.05:
            return "DOUBLE_PINCH_ZOOM"
        elif fist_dist < 0.25:
            return "FIST_GRAB_LINK"
        else:
            return "CLAW_TARGETING"

    def process_frame(self, frame):
        """Processes live camera feed and generates spatial matrix commands."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Extract Hand Core Coordinates
                palm_center = hand_landmarks.landmark[9]
                gesture = self.detect_gestures(hand_landmarks.landmark)

                return {
                    "hand_detected": True,
                    "gesture": gesture,
                    "coordinates": {"x": palm_center.x, "y": palm_center.y, "z": palm_center.z}
                }

        return {"hand_detected": False, "gesture": "NONE", "coordinates": None}

# Usage Test Execution
if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    engine = BareHandsEngine()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        data = engine.process_frame(frame)
        if data["hand_detected"]:
            print(f"Gesture: {data['gesture']} | X: {data['coordinates']['x']:.2f}, Y: {data['coordinates']['y']:.2f}")

        cv2.imshow("StonicX BareHands Engine Tracker", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
