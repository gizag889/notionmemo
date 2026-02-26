import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {
    COPY_ICON_SVG,
    DRAG_ICON_SVG,
    PENCIL_ICON_SVG,
    REFRESH_ICON_SVG,
} from "../constants/icons";
import { useDraggable } from "../hooks/useDraggable";
import { SvgWidget } from "./SvgWidget";

interface FloatingMenuProps {
  onCopy: () => void;
  onRefresh: () => void;
}

export function FloatingMenu({ onCopy, onRefresh }: FloatingMenuProps) {
  const router = useRouter();
  const { pan, animatedStyle } = useDraggable();

  return (
    <Animated.View style={[styles.fabContainer, animatedStyle]}>
      {/* Copy Button */}
      <TouchableOpacity style={styles.controlButton} onPress={onCopy}>
        <SvgWidget svg={COPY_ICON_SVG} width={30} height={30} color="#fff" />
      </TouchableOpacity>

      {/* Quick Input */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => router.push("/quick-input")}
      >
        <SvgWidget
          svg={PENCIL_ICON_SVG}
          style={{
            height: 28,
            width: 28,
          }}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onRefresh}>
        <SvgWidget svg={REFRESH_ICON_SVG} width={24} height={24} color="#fff" />
      </TouchableOpacity>

      {/* Drag Handle */}
      <GestureDetector gesture={pan}>
        <View
          style={styles.dragHandle}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="ドラッグハンドル"
          accessibilityHint="ドラッグして位置を移動します"
        >
          <SvgWidget svg={DRAG_ICON_SVG} width={24} height={24} color="#fff" />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 50,
    backgroundColor: "#000",
    width: 60,
    borderRadius: 30,
    alignItems: "center",
    elevation: 5,
    paddingVertical: 12,
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
