package org.dukeroyahl.synaptik.mapper;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;
import java.util.UUID;

/**
 * MapStruct mapper for converting between Task entity and TaskDTO.
 */
@Mapper(componentModel = "cdi", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
public interface TaskMapper {
    
    /**
     * Convert Task entity to TaskDTO for API response.
     * Maps UUID to String and includes project name if available.
     */
    @Mapping(target = "projectName", ignore = true) // Set separately in service
    TaskDTO toDTO(Task task);
    
    /**
     * Convert list of Task entities to TaskDTO list.
     */
    List<TaskDTO> toDTOList(List<Task> tasks);
    

    /**
     * Convert TaskRequest to Task entity for database operations.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true) // Set by service
    @Mapping(target = "updatedAt", ignore = true) // Set by service
    @Mapping(target = "urgency", ignore = true) // Calculated separately
    @Mapping(target = "annotations", ignore = true) // Not in request
    @Mapping(target = "originalInput", ignore = true) // Not in request
    Task toEntity(TaskRequest taskRequest);

    /**
     * Update existing Task entity from TaskRequest.
     */
    @Mapping(target = "id", ignore = true) // Never update ID
    @Mapping(target = "createdAt", ignore = true) // Never update creation time
    @Mapping(target = "updatedAt", ignore = true) // Set by service
    @Mapping(target = "urgency", ignore = true) // Calculated separately
    @Mapping(target = "annotations", ignore = true) // Not in request
    @Mapping(target = "originalInput", ignore = true) // Not in request
    Task updateEntityFromRequest(TaskRequest updates, @MappingTarget Task task);

}
