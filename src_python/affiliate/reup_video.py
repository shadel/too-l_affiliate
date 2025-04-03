import os
import json
import threading
from moviepy.editor import VideoFileClip
import effect_input

class REUPVideo:
    def __init__(self):
        # Get the current directory of the script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Path to the data file
        self.data_file = os.path.join(current_dir, '..', '..', 'data', 'reup_video_data.json')
        # Load the data from the JSON file
        with open(self.data_file, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        
        # Create output directory if it doesn't exist
        self.output_dir = self.data['saveLocation']
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        
        # Set the number of threads
        self.threads = self.data['threads']
        # Get the videos and effects
        self.videos = self.data['videos']
        self.effects = self.data['effects']
        
        # Dictionary to map effect names to their respective functions
        self.effect_map = {
            'slide_in_left': effect_input.transition_slide_in_left,
            'slide_in_right': effect_input.transition_slide_in_right,
            'fade_in': effect_input.transition_fade_in,
            'slide_in_top': effect_input.transition_slide_in_top,
            'slide_in_bottom': effect_input.transition_slide_in_bottom,
            'blur_in': effect_input.transition_blur_in,
            'split_screen': effect_input.transition_split_screen,
            'blink_in': effect_input.transition_blink_in,
            'flash_in': effect_input.transition_flash_in,
            'burst_in': effect_input.transition_burst_in,
            'flicker_in': effect_input.transition_flicker_in,
            'shrink_in': effect_input.transition_shrink_in,
            'glitch_in_quick': effect_input.transition_glitch_in_quick
        }
    
    def apply_effect_to_video(self, video_path, effect_name, output_path):
        """Apply the specified effect to a video and save it to the output path"""
        try:
            # Send start status
            print(json.dumps({
                "path": video_path,
                "effect": effect_name,
                "status": f"Đang xử lý hiệu ứng {effect_name}",
                "progress": 0
            }))

            # Load the video clip
            clip = VideoFileClip(video_path)
            
            # Get the effect function from the map
            effect_func = self.effect_map.get(effect_name)
            if not effect_func:
                raise ValueError(f"Hiệu ứng không hỗ trợ: {effect_name}")

            # Apply the effect
            processed_clip = effect_func(clip)
            
            # Write the processed video to output (removed progress_bar parameter)
            processed_clip.write_videofile(
                output_path,
                fps=24,
                codec='libx264',
                audio_codec='aac',
                preset='ultrafast',
                threads=4,
                bitrate='1000k'
            )
            
            # Clean up
            clip.close()
            processed_clip.close()
            
            # Send completion status
            print(json.dumps({
                "path": video_path,
                "effect": effect_name,
                "status": "Đã xử lý",
                "progress": 100
            }))
            
            return True
        except Exception as e:
            # Send error status
            print(json.dumps({
                "path": video_path,
                "effect": effect_name,
                "status": f"Lỗi: {str(e)}",
                "progress": -1
            }))
            return False
    
    def process_video(self, video):
        """Process a single video with all specified effects"""
        video_path = video['path']
        total_effects = len(self.effects)
        current_effect = 0
        
        print(json.dumps({
            "path": video_path,
            "status": f"Bắt đầu xử lý {total_effects} hiệu ứng",
            "total_effects": total_effects,
            "current_effect": current_effect
        }))

        video_name = os.path.basename(video_path)
        video_base_name, video_ext = os.path.splitext(video_name)
        
        for effect in self.effects:
            current_effect += 1
            # Create output file name
            output_name = f"{video_base_name}_{effect}{video_ext}"
            output_path = os.path.join(self.output_dir, output_name)
            
            # Update progress before processing effect
            print(json.dumps({
                "path": video_path,
                "status": f"Đang xử lý hiệu ứng {current_effect}/{total_effects}",
                "total_effects": total_effects,
                "current_effect": current_effect
            }))
            
            # Apply the effect and save
            success = self.apply_effect_to_video(video_path, effect, output_path)
            if not success:
                # Update video status in data
                video['status'] = "Lỗi"
                break
        
        if success:
            # Update video status in data
            video['status'] = "Đã xử lý"
        
        # Save updated status to the JSON file
        self.save_data()
    
    def save_data(self):
        """Save the updated data back to the JSON file"""
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def process_all_videos(self):
        """Process all videos in the data file"""
        # Create a list to store all threads
        threads = []
        
        # Create and start a thread for each video
        for video in self.videos:
            if video['status'] == "Chưa xử lý":
                thread = threading.Thread(target=self.process_video, args=(video,))
                thread.start()
                threads.append(thread)
                
                # If we've reached the maximum number of threads, wait for them to complete
                if len(threads) >= self.threads:
                    for t in threads:
                        t.join()
                    threads = []
        
        # Wait for any remaining threads to complete
        for t in threads:
            t.join()
        
        # Send completion message in JSON format
        print(json.dumps({
            "status": "Đã xử lý tất cả video",
            "progress": 100,
            "complete": True
        }))

# Run the script if it's the main module
if __name__ == "__main__":
    reup = REUPVideo()
    reup.process_all_videos()