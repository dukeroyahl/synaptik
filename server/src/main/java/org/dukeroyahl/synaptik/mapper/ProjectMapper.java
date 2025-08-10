package org.dukeroyahl.synaptik.mapper;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.dto.UpdateProject;
import org.mapstruct.*;

/**
 * MapStruct mapper for Project entity and UpdateProject record conversions.
 * Handles mapping between domain entities and DTOs with null-safe partial updates.
 */
@Mapper(
    componentModel = "cdi",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface ProjectMapper {

    /**
     * Update an existing Project entity with values from UpdateProject record.
     * Only non-null fields from the update record will be applied.
     * 
     * @param updateProject The update record containing new values
     * @param project The existing project entity to update
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateProjectFromRecord(UpdateProject updateProject, @MappingTarget Project project);

    /**
     * Create a new Project entity from UpdateProject record.
     * 
     * @param updateProject The update record to convert
     * @return A new Project entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Project toProject(UpdateProject updateProject);

    /**
     * Create an UpdateProject record from an existing Project entity.
     * 
     * @param project The project entity to convert
     * @return UpdateProject record with values from the entity
     */
    UpdateProject fromProject(Project project);

    /**
     * Partial update methods for specific fields.
     * These methods create UpdateProject records with only the specified field set.
     */
    @Mapping(target = "description", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "progress", ignore = true)
    @Mapping(target = "color", ignore = true)
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "endDate", ignore = true)
    @Mapping(target = "dueDate", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "members", ignore = true)
    UpdateProject nameOnly(String name);

    /**
     * Create UpdateProject with only description field.
     */
    @Mapping(target = "name", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "progress", ignore = true)
    @Mapping(target = "color", ignore = true)
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "endDate", ignore = true)
    @Mapping(target = "dueDate", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "members", ignore = true)
    UpdateProject descriptionOnly(String description);

    /**
     * Default methods for common partial updates using MapStruct's @AfterMapping.
     */
    default UpdateProject createNameUpdate(String name) {
        return UpdateProject.builder().name(name).build();
    }

    default UpdateProject createDescriptionUpdate(String description) {
        return UpdateProject.builder().description(description).build();
    }

    default UpdateProject createProgressUpdate(Double progress) {
        return UpdateProject.builder().progress(progress).build();
    }
}
