package com.neurofleetx.controller;

import com.neurofleetx.model.Message;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.MessageRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    // Get messages sorted by newest first
    @GetMapping("/{userId}")
    public List<Message> getMessagesForUser(@PathVariable Long userId) {
        return messageRepository.findByReceiverIdOrderBySentAtDesc(userId);
    }

    // Get unread message count
    @GetMapping("/unread-count/{userId}")
    public ResponseEntity<?> getUnreadCount(@PathVariable Long userId) {
        Long count = messageRepository.countByReceiverIdAndIsRead(userId, false);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // Mark single message as read
    @PutMapping("/{messageId}/mark-read")
    public ResponseEntity<?> markAsRead(@PathVariable Long messageId) {
        try {
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("Message not found"));
            message.setIsRead(true);
            messageRepository.save(message);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Mark all messages as read for a user
    @PutMapping("/mark-all-read/{userId}")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long userId) {
        try {
            List<Message> messages = messageRepository.findByReceiverId(userId);
            messages.forEach(msg -> msg.setIsRead(true));
            messageRepository.saveAll(messages);
            return ResponseEntity.ok(Map.of("message", "All messages marked as read", "count", messages.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        try {
            Long senderId = ((Number) payload.get("senderId")).longValue();
            Long receiverId = ((Number) payload.get("receiverId")).longValue();
            String content = (String) payload.get("content");

            User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("Sender not found"));
            User receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            Message msg = new Message();
            msg.setSender(sender);
            msg.setReceiver(receiver);
            msg.setContent(content);
            // sentAt and isRead will be set by @PrePersist

            messageRepository.save(msg);
            return ResponseEntity.ok(Map.of("message", "Message sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
