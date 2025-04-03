import os
import numpy as np
from moviepy.editor import VideoFileClip, VideoClip
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import multiprocessing
import json
# Tối ưu dựa trên số CPU có sẵn
DEFAULT_WORKERS = max(2, multiprocessing.cpu_count() - 1)

# Resize video để xử lý nhanh hơn
def resize_video(video_clip, scale=0.7):
    """Giảm kích thước video để xử lý nhanh hơn"""
    return video_clip.resize(scale)

# Hiệu ứng slide in từ trái
def transition_slide_in_left(clip, duration=0.5):
    """Video slides in from left to right with black area being replaced"""
    def make_frame(t):
        progress = min(1, t / duration)
        if progress >= 1:
            return clip.get_frame(t)
        frame = np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
        original = clip.get_frame(t)
        width = int(clip.w * progress)
        frame[:, :width] = original[:, :width]
        return frame
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng slide in từ phải
def transition_slide_in_right(clip, duration=0.5):
    """Video slides in from right to left with black area being replaced"""
    def make_frame(t):
        progress = min(1, t / duration)
        if progress >= 1:
            return clip.get_frame(t)
        frame = np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
        original = clip.get_frame(t)
        width = int(clip.w * progress)
        frame[:, clip.w - width:] = original[:, clip.w - width:]
        return frame
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng fade in
def transition_fade_in(clip, duration=0.5):
    """Video fades in gradually"""
    return clip.fadein(duration)

# Hiệu ứng slide in từ trên xuống
def transition_slide_in_top(clip, duration=0.5):
    """Video slides in from top to bottom with black area being replaced"""
    def make_frame(t):
        progress = min(1, t / duration)
        if progress >= 1:
            return clip.get_frame(t)
        frame = np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
        original = clip.get_frame(t)
        height = int(clip.h * progress)
        frame[:height, :] = original[:height, :]
        return frame
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng slide in từ dưới lên
def transition_slide_in_bottom(clip, duration=0.5):
    """Video slides in from bottom to top with black area being replaced"""
    def make_frame(t):
        progress = min(1, t / duration)
        if progress >= 1:
            return clip.get_frame(t)
        frame = np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
        original = clip.get_frame(t)
        height = int(clip.h * progress)
        frame[clip.h - height:, :] = original[clip.h - height:, :]
        return frame
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng blur in
def transition_blur_in(clip, duration=0.5):
    """Video starts blurry and becomes clear"""
    def blur_effect(image, t):
        blur_amount = max(1, int(10 * (1 - min(1, t / duration))))
        if blur_amount == 1:
            return image
        small = np.array(Image.fromarray(image).resize(
            (image.shape[1] // blur_amount, image.shape[0] // blur_amount)))
        return np.array(Image.fromarray(small).resize(
            (image.shape[1], image.shape[0])))

    def make_frame(t):
        if t < duration:
            return blur_effect(clip.get_frame(t), t)
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng split screen
def transition_split_screen(clip, duration=0.5):
    """Video splits from center and comes together"""
    def make_frame(t):
        if t < duration:
            frame = np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
            original = clip.get_frame(t)
            split = int((clip.w / 2) * (1 - t / duration))
            frame[:, :clip.w // 2 - split] = original[:, :clip.w // 2 - split]
            frame[:, clip.w // 2 + split:] = original[:, clip.w // 2 + split:]
            return frame
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng blink in
def transition_blink_in(clip, duration=0.3):
    """Video blinks once and appears"""
    def make_frame(t):
        if t < duration / 2:
            return np.zeros((clip.h, clip.w, 3), dtype=np.uint8)  # Khung hình đen
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng flash in
def transition_flash_in(clip, duration=0.3):
    """Video flashes quickly and appears"""
    def make_frame(t):
        if t < duration / 2:
            return (clip.get_frame(t) * (t / (duration / 2))).astype(np.uint8)  # Chớp sáng
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng burst in
def transition_burst_in(clip, duration=0.3):
    """Video bursts in with strong brightness"""
    def make_frame(t):
        if t < duration / 2:
            brightness = np.clip(clip.get_frame(t) * (1 + t / (duration / 2)), 0, 255).astype(np.uint8)
            return brightness  # Phát sáng mạnh
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng flicker in
def transition_flicker_in(clip, duration=0.3):
    """Video flickers like neon light and appears"""
    def make_frame(t):
        if t < duration:
            if int(t * 20) % 2 == 0:  # Nhấp nháy nhanh hơn (x20 thay vì x10)
                return np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
            else:
                return clip.get_frame(t)
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng shrink in
def transition_shrink_in(clip, duration=0.3):
    """Video appears from a small point and grows quickly"""
    def make_frame(t):
        if t < duration:
            scale = 0.1 + 0.9 * min(1, t / duration)  # Xuất hiện từ nhỏ đến lớn
            frame = np.zeros((clip.h, clip.w, 3), dtype=np.uint8)
            
            # Calculate dimensions for the resized image
            h_resize = int(clip.h * scale)
            w_resize = int(clip.w * scale)
            
            # Only proceed if dimensions are valid
            if h_resize > 0 and w_resize > 0:
                # Get the frame and resize it
                original = clip.get_frame(t)
                resized = np.array(Image.fromarray(original).resize((w_resize, h_resize)))
                
                # Calculate the position to center the resized image
                h_start = (clip.h - h_resize) // 2
                w_start = (clip.w - w_resize) // 2
                
                # Place the resized image on the frame
                frame[h_start:h_start+h_resize, w_start:w_start+w_resize] = resized
                
            return frame
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Hiệu ứng glitch in quick
def transition_glitch_in_quick(clip, duration=0.3):
    """Video glitches briefly and stabilizes"""
    def make_frame(t):
        if t < duration / 2:
            frame = clip.get_frame(t)
            glitch = np.random.randint(0, 50, frame.shape, dtype=np.uint8)  # Nhiễu sóng
            return np.clip(frame + glitch, 0, 255).astype(np.uint8)
        else:
            return clip.get_frame(t)
    
    new_clip = VideoClip(make_frame, duration=clip.duration)
    new_clip.audio = clip.audio
    return new_clip

# Áp dụng hiệu ứng cho một video
def apply_transition_to_video(video_path, output_folder, transition_type=None):
    try:
        print(json.dumps({
            "path": video_path,
            "effect": transition_type,
            "status": f"Đang chuẩn bị hiệu ứng {transition_type}",
            "progress": 0
        }))
        video = VideoFileClip(video_path)
        
        # Resize để tăng tốc xử lý
        video = resize_video(video)
        def progress_callback(t):
            if t % 5 == 0:  # Report every 5%
                print(json.dumps({
                    "path": video_path,
                    "effect": transition_type,
                    "status": f"Đang xử lý: {int(t)}%",
                    "progress": int(t)
                }))
        
        transitions = {
            "slide_in_left": transition_slide_in_left,
            "slide_in_right": transition_slide_in_right,
            "fade_in": transition_fade_in,
            "slide_in_top": transition_slide_in_top,
            "slide_in_bottom": transition_slide_in_bottom,
            "blur_in": transition_blur_in,
            "split_screen": transition_split_screen,
            "blink_in": transition_blink_in,
            "flash_in": transition_flash_in,
            "burst_in": transition_burst_in,
            "flicker_in": transition_flicker_in,
            "shrink_in": transition_shrink_in,
            "glitch_in_quick": transition_glitch_in_quick,
        }
        
        if transition_type not in transitions:
            raise ValueError(f"Transition type '{transition_type}' is not supported.")
        
        video_with_transition = transitions[transition_type](video)
        
        output_filename = f"transition_{transition_type}.mp4"
        output_path = os.path.join(output_folder, output_filename)
        
        # Viết video với cài đặt để tăng tốc
        video_with_transition.write_videofile(
            output_path,
            fps=24,
            codec='libx264',
            audio_codec='aac',
            preset='ultrafast',
            threads=4,
            bitrate='1000k',
            progress_bar=False,
            callback=progress_callback
        )

        print(json.dumps({
            "path": video_path,
            "effect": transition_type,
            "status": "Hoàn thành",
            "progress": 100
        }))

    except Exception as e:
        print(json.dumps({
            "path": video_path,
            "effect": transition_type,
            "status": f"Lỗi: {str(e)}",
            "progress": -1
        }))
        raise e

# Xử lý nhiều hiệu ứng cùng lúc với đa luồng
def process_all_transitions(video_path, output_folder, transition_types):
    os.makedirs(output_folder, exist_ok=True)
    
    # Sử dụng số luồng tối ưu dựa trên CPU
    max_workers = DEFAULT_WORKERS
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(apply_transition_to_video, video_path, output_folder, t_type): t_type 
                  for t_type in transition_types}
        
        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()
            except Exception as e:
                t_type = futures[future]
                print(f"Lỗi khi xử lý {t_type}: {e}")

# Chức năng chính
if __name__ == "__main__":
    # Thư mục đầu vào và đầu ra
    OUTPUT_FOLDER = r"C:\shin\shinsad\tool_affiliate\MMO\tool_spam_groups\video\outputs"
    video_path = r"C:\shin\shinsad\tool_affiliate\MMO\tool_spam_groups\video\Vn_Snaptik_Com_6908165658152930562.mp4"
    
    # Danh sách các hiệu ứng
    transition_types = [
        "slide_in_left", "slide_in_right", "fade_in", "slide_in_top", 
        "slide_in_bottom", "blur_in", "split_screen", "blink_in", 
        "flash_in", "burst_in", "flicker_in", "shrink_in", "glitch_in_quick"
    ]
    
    # Xử lý đa luồng cho tất cả hiệu ứng
    process_all_transitions(video_path, OUTPUT_FOLDER, transition_types)
    
    print("Tất cả video với hiệu ứng đã được tạo thành công!")