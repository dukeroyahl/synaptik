export class TagUtils {
  /**
   * Format tags consistently (capitalize first letter, trim, remove empty)
   */
  static formatTags(tags: string[] | string): string[] {
    const tagArray = Array.isArray(tags) ? tags : [tags]
    
    return tagArray
      .map(tag => {
        const trimmed = tag.trim()
        if (!trimmed) return ''
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
      })
      .filter(tag => tag !== '')
  }

  /**
   * Format a single tag
   */
  static formatTag(tag: string): string {
    const trimmed = tag.trim()
    if (!trimmed) return ''
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }

  /**
   * Parse tag string input (handles comma-separated values)
   */
  static parseTagInput(input: string): string[] {
    if (!input.trim()) return []
    
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '')
      .map(tag => this.formatTag(tag))
  }

  /**
   * Validate a tag name
   */
  static isValidTag(tag: string): boolean {
    const trimmed = tag.trim()
    return trimmed.length > 0 && 
           trimmed.length <= 50 && 
           /^[a-zA-Z0-9_-]+$/.test(trimmed)
  }

  /**
   * Filter tags to only include valid ones
   */
  static filterValidTags(tags: string[]): string[] {
    return tags.filter(tag => this.isValidTag(tag))
  }

  /**
   * Get unique tags from an array
   */
  static getUniqueTags(tags: string[]): string[] {
    return [...new Set(this.formatTags(tags))]
  }

  /**
   * Normalize tags for database storage
   */
  static normalizeTags(tags: string[] | undefined): string[] {
    if (!tags || !Array.isArray(tags)) return []
    return this.getUniqueTags(this.filterValidTags(tags))
  }

  /**
   * Create tag filter for MongoDB queries
   */
  static createTagFilter(tags: string[]): any {
    const formattedTags = this.formatTags(tags)
    return formattedTags.length > 0 ? { tags: { $in: formattedTags } } : {}
  }
}