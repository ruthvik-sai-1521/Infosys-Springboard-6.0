package com.neurofleetx.repository;

import com.neurofleetx.model.AdminRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdminRequestRepository extends JpaRepository<AdminRequest, Long> {

    // Get all requests sent by a specific manager
    List<AdminRequest> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    // Get all requests for admins (either specific admin or broadcast to all)
    @Query("SELECT ar FROM AdminRequest ar WHERE ar.receiver.id = ?1 OR ar.receiver IS NULL ORDER BY ar.createdAt DESC")
    List<AdminRequest> findByReceiverIdOrReceiverIsNullOrderByCreatedAtDesc(Long receiverId);

    // Get all pending requests
    List<AdminRequest> findByStatusOrderByCreatedAtDesc(AdminRequest.RequestStatus status);
}
